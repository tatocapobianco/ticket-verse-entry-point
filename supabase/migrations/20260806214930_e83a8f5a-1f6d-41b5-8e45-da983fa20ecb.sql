-- ============ guard ============
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.admin_require()
RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_log(_action text, _entity_type text, _entity_id text, _entity_label text, _details jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.admin_audit_log(actor_id, actor_email, action, entity_type, entity_id, entity_label, details)
  VALUES (auth.uid(), (SELECT email FROM public.profiles WHERE id = auth.uid()), _action, _entity_type, _entity_id, _entity_label, COALESCE(_details,'{}'::jsonb));
END;
$$;

-- ============ metrics ============
CREATE OR REPLACE FUNCTION public.admin_metrics(_from timestamptz, _to timestamptz, _granularity text DEFAULT 'day')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v jsonb; prev jsonb; span interval; pfrom timestamptz; pto timestamptz; series jsonb;
BEGIN
  PERFORM public.admin_require();
  span := _to - _from;
  pfrom := _from - span; pto := _from;

  SELECT jsonb_build_object(
    'gmv', COALESCE(SUM(p.total),0),
    'commission', COALESCE(SUM(p.service_fee),0),
    'orders', COUNT(*),
    'avg_ticket', CASE WHEN COUNT(*) = 0 THEN 0 ELSE COALESCE(SUM(p.total),0)/COUNT(*) END,
    'tickets', COALESCE((SELECT COUNT(*) FROM public.tickets t JOIN public.purchases pp ON pp.id = t.purchase_id
        WHERE pp.status IN ('approved','paid') AND pp.created_at >= _from AND pp.created_at < _to),0)
  ) INTO v
  FROM public.purchases p
  WHERE p.status IN ('approved','paid') AND p.created_at >= _from AND p.created_at < _to;

  SELECT jsonb_build_object(
    'gmv', COALESCE(SUM(p.total),0),
    'commission', COALESCE(SUM(p.service_fee),0),
    'orders', COUNT(*),
    'tickets', COALESCE((SELECT COUNT(*) FROM public.tickets t JOIN public.purchases pp ON pp.id = t.purchase_id
        WHERE pp.status IN ('approved','paid') AND pp.created_at >= pfrom AND pp.created_at < pto),0)
  ) INTO prev
  FROM public.purchases p
  WHERE p.status IN ('approved','paid') AND p.created_at >= pfrom AND p.created_at < pto;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('bucket', b, 'gmv', g, 'commission', c, 'orders', o) ORDER BY b), '[]'::jsonb)
  INTO series
  FROM (
    SELECT date_trunc(CASE WHEN _granularity IN ('day','week','month') THEN _granularity ELSE 'day' END, p.created_at) AS b,
           SUM(p.total) AS g, SUM(p.service_fee) AS c, COUNT(*) AS o
    FROM public.purchases p
    WHERE p.status IN ('approved','paid') AND p.created_at >= _from AND p.created_at < _to
    GROUP BY 1
  ) s;

  RETURN jsonb_build_object(
    'current', v,
    'previous', prev,
    'series', series,
    'active_events', (SELECT COUNT(*) FROM public.events WHERE status = 'active'),
    'total_events', (SELECT COUNT(*) FROM public.events),
    'productoras', (SELECT COUNT(*) FROM public.productoras),
    'users', (SELECT COUNT(*) FROM public.profiles)
  );
END;
$$;

-- ============ settlements ============
CREATE OR REPLACE FUNCTION public.admin_settlements(_from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL, _event_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'productora_nombre'), '[]'::jsonb) INTO res FROM (
    SELECT jsonb_build_object(
      'productora_id', pr.id,
      'productora_nombre', pr.nombre,
      'event_id', e.id,
      'event_name', e.name,
      'gross', SUM(p.total),
      'commission', SUM(p.service_fee),
      'net', SUM(p.total) - SUM(p.service_fee),
      'orders', COUNT(*),
      'status', COALESCE(st.status, 'pending'),
      'paid_at', st.paid_at,
      'paid_by_email', (SELECT email FROM public.profiles WHERE id = st.paid_by)
    ) AS x
    FROM public.purchases p
    JOIN public.events e ON e.id = p.event_id
    JOIN public.productoras pr ON pr.id = e.productora_id
    LEFT JOIN public.settlements st ON st.productora_id = pr.id AND st.event_id = e.id
    WHERE p.status IN ('approved','paid')
      AND (_from IS NULL OR p.created_at >= _from)
      AND (_to IS NULL OR p.created_at < _to)
      AND (_event_id IS NULL OR e.id = _event_id)
    GROUP BY pr.id, pr.nombre, e.id, e.name, st.status, st.paid_at, st.paid_by
  ) q;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_settlement(_productora_id uuid, _event_id uuid, _status text, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g numeric; c numeric; lbl text;
BEGIN
  PERFORM public.admin_require();
  IF _status NOT IN ('pending','paid') THEN RAISE EXCEPTION 'invalid_status'; END IF;

  SELECT COALESCE(SUM(p.total),0), COALESCE(SUM(p.service_fee),0) INTO g, c
  FROM public.purchases p WHERE p.event_id = _event_id AND p.status IN ('approved','paid');

  INSERT INTO public.settlements(productora_id, event_id, gross, commission, net, status, paid_at, paid_by, note)
  VALUES (_productora_id, _event_id, g, c, g - c, _status,
          CASE WHEN _status = 'paid' THEN now() END,
          CASE WHEN _status = 'paid' THEN auth.uid() END, _note)
  ON CONFLICT (productora_id, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid))
  DO UPDATE SET gross = EXCLUDED.gross, commission = EXCLUDED.commission, net = EXCLUDED.net,
                status = EXCLUDED.status, paid_at = EXCLUDED.paid_at, paid_by = EXCLUDED.paid_by,
                note = COALESCE(EXCLUDED.note, public.settlements.note);

  SELECT name INTO lbl FROM public.events WHERE id = _event_id;
  PERFORM public.admin_log('settlement_' || _status, 'settlement', _event_id::text, lbl,
    jsonb_build_object('net', g - c, 'productora_id', _productora_id));
END;
$$;

-- ============ transactions ============
CREATE OR REPLACE FUNCTION public.admin_transactions(
  _from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL,
  _productora_id uuid DEFAULT NULL, _event_id uuid DEFAULT NULL,
  _status text DEFAULT NULL, _search text DEFAULT NULL,
  _limit int DEFAULT 50, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; total bigint; q text;
BEGIN
  PERFORM public.admin_require();
  q := NULLIF(trim(COALESCE(_search,'')), '');

  SELECT COUNT(*) INTO total
  FROM public.purchases p
  JOIN public.events e ON e.id = p.event_id
  LEFT JOIN public.productoras pr ON pr.id = e.productora_id
  WHERE (_from IS NULL OR p.created_at >= _from)
    AND (_to IS NULL OR p.created_at < _to)
    AND (_productora_id IS NULL OR pr.id = _productora_id)
    AND (_event_id IS NULL OR e.id = _event_id)
    AND (_status IS NULL OR p.status = _status)
    AND (q IS NULL OR p.buyer_email ILIKE '%'||q||'%' OR p.mp_payment_id ILIKE '%'||q||'%' OR p.id::text ILIKE '%'||q||'%');

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO rows FROM (
    SELECT jsonb_build_object(
      'id', p.id, 'created_at', p.created_at,
      'buyer_email', COALESCE(p.buyer_email, pf.email),
      'buyer_name', pf.full_name,
      'event_id', e.id, 'event_name', e.name,
      'productora_id', pr.id, 'productora_nombre', pr.nombre,
      'tandas', (SELECT string_agg(tt.name || ' x' || pi.quantity, ', ')
                 FROM public.purchase_items pi JOIN public.ticket_types tt ON tt.id = pi.ticket_type_id
                 WHERE pi.purchase_id = p.id),
      'total', p.total, 'subtotal', p.subtotal, 'commission', p.service_fee,
      'status', p.status, 'mp_payment_id', p.mp_payment_id,
      'method', CASE WHEN p.mp_payment_id IS NOT NULL THEN 'MercadoPago' ELSE 'â€”' END
    ) AS x, p.created_at
    FROM public.purchases p
    JOIN public.events e ON e.id = p.event_id
    LEFT JOIN public.productoras pr ON pr.id = e.productora_id
    LEFT JOIN public.profiles pf ON pf.id = p.buyer_id
    WHERE (_from IS NULL OR p.created_at >= _from)
      AND (_to IS NULL OR p.created_at < _to)
      AND (_productora_id IS NULL OR pr.id = _productora_id)
      AND (_event_id IS NULL OR e.id = _event_id)
      AND (_status IS NULL OR p.status = _status)
      AND (q IS NULL OR p.buyer_email ILIKE '%'||q||'%' OR p.mp_payment_id ILIKE '%'||q||'%' OR p.id::text ILIKE '%'||q||'%')
    ORDER BY p.created_at DESC
    LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0)
  ) s;

  RETURN jsonb_build_object('rows', rows, 'total', total);
END;
$$;

-- ============ directory ============
CREATE OR REPLACE FUNCTION public.admin_productoras(_search text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb; q text;
BEGIN
  PERFORM public.admin_require();
  q := NULLIF(trim(COALESCE(_search,'')), '');
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'nombre'), '[]'::jsonb) INTO res FROM (
    SELECT jsonb_build_object(
      'id', pr.id, 'nombre', pr.nombre, 'slug', pr.slug, 'logo_url', pr.logo_url,
      'instagram', pr.instagram, 'telefono_contacto', pr.telefono_contacto,
      'email_contacto', pr.email_contacto, 'descripcion', pr.descripcion,
      'created_at', pr.created_at, 'suspended', pr.suspended,
      'owner_email', pf.email, 'owner_name', pf.full_name,
      'events_count', (SELECT COUNT(*) FROM public.events e WHERE e.productora_id = pr.id),
      'tickets_sold', (SELECT COUNT(*) FROM public.tickets t JOIN public.events e ON e.id = t.event_id
                       WHERE e.productora_id = pr.id AND t.purchase_id IS NOT NULL),
      'revenue', (SELECT COALESCE(SUM(p.total),0) FROM public.purchases p JOIN public.events e ON e.id = p.event_id
                  WHERE e.productora_id = pr.id AND p.status IN ('approved','paid'))
    ) AS x
    FROM public.productoras pr
    LEFT JOIN public.profiles pf ON pf.id = pr.user_id
    WHERE q IS NULL OR pr.nombre ILIKE '%'||q||'%' OR pf.email ILIKE '%'||q||'%'
  ) s;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_productora(_id uuid, _patch jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.productoras SET
    nombre = COALESCE(NULLIF(_patch->>'nombre',''), nombre),
    descripcion = COALESCE(_patch->>'descripcion', descripcion),
    instagram = COALESCE(_patch->>'instagram', instagram),
    telefono_contacto = COALESCE(_patch->>'telefono_contacto', telefono_contacto),
    email_contacto = COALESCE(_patch->>'email_contacto', email_contacto)
  WHERE id = _id RETURNING nombre INTO lbl;
  PERFORM public.admin_log('productora_updated', 'productora', _id::text, lbl, _patch);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_productora_suspended(_id uuid, _suspended boolean, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.productoras
     SET suspended = _suspended,
         suspended_at = CASE WHEN _suspended THEN now() ELSE NULL END,
         suspended_reason = CASE WHEN _suspended THEN _reason ELSE NULL END
   WHERE id = _id RETURNING nombre INTO lbl;
  IF _suspended THEN
    UPDATE public.events SET status = 'inactive', is_public = false WHERE productora_id = _id;
  END IF;
  PERFORM public.admin_log(CASE WHEN _suspended THEN 'productora_suspended' ELSE 'productora_reactivated' END,
    'productora', _id::text, lbl, jsonb_build_object('reason', _reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_events(_search text DEFAULT NULL, _productora_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb; q text;
BEGIN
  PERFORM public.admin_require();
  q := NULLIF(trim(COALESCE(_search,'')), '');
  SELECT COALESCE(jsonb_agg(x ORDER BY x->>'created_at' DESC), '[]'::jsonb) INTO res FROM (
    SELECT jsonb_build_object(
      'id', e.id, 'name', e.name, 'event_number', e.event_number,
      'event_date', e.event_date, 'event_time', e.event_time, 'location', e.location,
      'image_url', e.image_url, 'status', e.status, 'is_public', e.is_public,
      'created_at', e.created_at, 'description', e.description,
      'productora_id', e.productora_id,
      'productora_nombre', pr.nombre,
      'organizer_email', pf.email,
      'tickets_sold', (SELECT COUNT(*) FROM public.tickets t WHERE t.event_id = e.id AND t.purchase_id IS NOT NULL),
      'revenue', (SELECT COALESCE(SUM(p.total),0) FROM public.purchases p WHERE p.event_id = e.id AND p.status IN ('approved','paid'))
    ) AS x
    FROM public.events e
    LEFT JOIN public.productoras pr ON pr.id = e.productora_id
    LEFT JOIN public.profiles pf ON pf.id = e.organizer_id
    WHERE (q IS NULL OR e.name ILIKE '%'||q||'%' OR e.event_number ILIKE '%'||q||'%' OR pr.nombre ILIKE '%'||q||'%')
      AND (_productora_id IS NULL OR e.productora_id = _productora_id)
  ) s;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_event(_id uuid, _patch jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.events SET
    name = COALESCE(NULLIF(_patch->>'name',''), name),
    description = COALESCE(_patch->>'description', description),
    location = COALESCE(_patch->>'location', location),
    event_date = COALESCE(NULLIF(_patch->>'event_date','')::date, event_date),
    event_time = COALESCE(NULLIF(_patch->>'event_time','')::time, event_time),
    status = COALESCE(NULLIF(_patch->>'status',''), status),
    is_public = COALESCE((_patch->>'is_public')::boolean, is_public)
  WHERE id = _id RETURNING name INTO lbl;
  PERFORM public.admin_log('event_updated', 'event', _id::text, lbl, _patch);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_event(_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text; sold int;
BEGIN
  PERFORM public.admin_require();
  SELECT name INTO lbl FROM public.events WHERE id = _id;
  SELECT COUNT(*) INTO sold FROM public.tickets WHERE event_id = _id AND purchase_id IS NOT NULL;
  DELETE FROM public.events WHERE id = _id;
  PERFORM public.admin_log('event_deleted', 'event', _id::text, lbl, jsonb_build_object('tickets_sold', sold));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_users(_search text DEFAULT NULL, _limit int DEFAULT 50, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; total bigint; q text;
BEGIN
  PERFORM public.admin_require();
  q := NULLIF(trim(COALESCE(_search,'')), '');
  SELECT COUNT(*) INTO total FROM public.profiles pf
   WHERE q IS NULL OR pf.email ILIKE '%'||q||'%' OR pf.full_name ILIKE '%'||q||'%' OR pf.dni ILIKE '%'||q||'%';

  SELECT COALESCE(jsonb_agg(x), '[]'::jsonb) INTO rows FROM (
    SELECT jsonb_build_object(
      'id', pf.id, 'email', pf.email, 'full_name', pf.full_name, 'dni', pf.dni,
      'created_at', pf.created_at, 'suspended', pf.suspended,
      'roles', (SELECT COALESCE(array_agg(ur.role::text), '{}') FROM public.user_roles ur WHERE ur.user_id = pf.id),
      'purchases', (SELECT COUNT(*) FROM public.purchases p WHERE p.buyer_id = pf.id AND p.status IN ('approved','paid')),
      'spent', (SELECT COALESCE(SUM(p.total),0) FROM public.purchases p WHERE p.buyer_id = pf.id AND p.status IN ('approved','paid')),
      'tickets', (SELECT COUNT(*) FROM public.tickets t WHERE t.owner_id = pf.id)
    ) AS x, pf.created_at
    FROM public.profiles pf
    WHERE q IS NULL OR pf.email ILIKE '%'||q||'%' OR pf.full_name ILIKE '%'||q||'%' OR pf.dni ILIKE '%'||q||'%'
    ORDER BY pf.created_at DESC
    LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0)
  ) s;
  RETURN jsonb_build_object('rows', rows, 'total', total);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_suspended(_id uuid, _suspended boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.profiles SET suspended = _suspended,
    suspended_at = CASE WHEN _suspended THEN now() ELSE NULL END
   WHERE id = _id RETURNING email INTO lbl;
  PERFORM public.admin_log(CASE WHEN _suspended THEN 'user_suspended' ELSE 'user_reactivated' END, 'user', _id::text, lbl, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_user_tickets(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id, 'qr_code', t.qr_code, 'status', t.status, 'source', t.source,
    'used_at', t.used_at, 'created_at', t.created_at,
    'event_name', e.name, 'ticket_type', tt.name, 'purchase_id', t.purchase_id
  ) ORDER BY t.created_at DESC), '[]'::jsonb) INTO res
  FROM public.tickets t
  JOIN public.events e ON e.id = t.event_id
  JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
  WHERE t.owner_id = _user_id;
  RETURN res;
END;
$$;

-- ============ support ============
CREATE OR REPLACE FUNCTION public.admin_event_support(_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT jsonb_build_object(
    'event', (SELECT jsonb_build_object('id', e.id, 'name', e.name, 'event_number', e.event_number,
                'status', e.status, 'is_public', e.is_public, 'productora_nombre', pr.nombre)
              FROM public.events e LEFT JOIN public.productoras pr ON pr.id = e.productora_id WHERE e.id = _event_id),
    'rrpps', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', er.id, 'name', r.name, 'contact', r.contact, 'link_code', er.link_code,
                'link_type', er.link_type, 'max_tickets', er.max_tickets, 'max_courtesies', er.max_courtesies,
                'active', er.active,
                'sales', (SELECT COUNT(*) FROM public.rrpp_sales rs WHERE rs.event_rrpp_id = er.id)
              )), '[]'::jsonb)
              FROM public.event_rrpps er JOIN public.rrpps r ON r.id = er.rrpp_id WHERE er.event_id = _event_id),
    'courtesies', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', cl.id, 'label', cl.label, 'code', cl.code, 'max_uses', cl.max_uses,
                'uses_count', cl.uses_count, 'is_active', cl.is_active, 'expires_at', cl.expires_at,
                'ticket_type', tt.name,
                'used', (SELECT COUNT(*) FROM public.tickets t WHERE t.courtesy_link_id = cl.id)
              )), '[]'::jsonb)
              FROM public.courtesy_links cl JOIN public.ticket_types tt ON tt.id = cl.ticket_type_id
              WHERE cl.event_id = _event_id),
    'failed_payments', (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', p.id, 'created_at', p.created_at, 'buyer_email', p.buyer_email,
                'total', p.total, 'status', p.status, 'mp_payment_id', p.mp_payment_id)), '[]'::jsonb)
              FROM public.purchases p WHERE p.event_id = _event_id AND p.status NOT IN ('approved','paid'))
  ) INTO res;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_courtesy(_link_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.courtesy_links SET is_active = false WHERE id = _link_id
    RETURNING COALESCE(label, code) INTO lbl;
  PERFORM public.admin_log('courtesy_revoked', 'courtesy_link', _link_id::text, lbl, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_rrpp_active(_event_rrpp_id uuid, _active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.event_rrpps SET active = _active WHERE id = _event_rrpp_id RETURNING link_code INTO lbl;
  PERFORM public.admin_log(CASE WHEN _active THEN 'rrpp_enabled' ELSE 'rrpp_disabled' END, 'event_rrpp', _event_rrpp_id::text, lbl, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_purchase_detail(_purchase_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT jsonb_build_object(
    'purchase', jsonb_build_object('id', p.id, 'created_at', p.created_at, 'status', p.status,
      'subtotal', p.subtotal, 'service_fee', p.service_fee, 'total', p.total,
      'mp_payment_id', p.mp_payment_id, 'buyer_email', COALESCE(p.buyer_email, pf.email),
      'buyer_name', pf.full_name, 'buyer_id', p.buyer_id),
    'event', jsonb_build_object('id', e.id, 'name', e.name, 'event_number', e.event_number,
      'event_date', e.event_date, 'productora_nombre', pr.nombre),
    'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object('ticket_type', tt.name, 'quantity', pi.quantity, 'unit_price', pi.unit_price)), '[]'::jsonb)
              FROM public.purchase_items pi JOIN public.ticket_types tt ON tt.id = pi.ticket_type_id WHERE pi.purchase_id = p.id),
    'tickets', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'qr_code', t.qr_code,
                  'status', t.status, 'used_at', t.used_at, 'ticket_type', tt.name, 'owner_email', t.owner_email)), '[]'::jsonb)
              FROM public.tickets t JOIN public.ticket_types tt ON tt.id = t.ticket_type_id WHERE t.purchase_id = p.id)
  ) INTO res
  FROM public.purchases p
  JOIN public.events e ON e.id = p.event_id
  LEFT JOIN public.productoras pr ON pr.id = e.productora_id
  LEFT JOIN public.profiles pf ON pf.id = p.buyer_id
  WHERE p.id = _purchase_id;
  RETURN COALESCE(res, 'null'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_ticket_used(_ticket_id uuid, _used boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE lbl text;
BEGIN
  PERFORM public.admin_require();
  UPDATE public.tickets
     SET status = CASE WHEN _used THEN 'used' ELSE 'valid' END,
         used_at = CASE WHEN _used THEN now() ELSE NULL END,
         used_by = CASE WHEN _used THEN auth.uid() ELSE NULL END
   WHERE id = _ticket_id RETURNING qr_code INTO lbl;
  PERFORM public.admin_log(CASE WHEN _used THEN 'ticket_marked_used' ELSE 'ticket_reverted' END, 'ticket', _ticket_id::text, lbl, '{}'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_failed_payments(_limit int DEFAULT 100)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', p.id, 'created_at', p.created_at, 'buyer_email', COALESCE(p.buyer_email, pf.email),
    'event_name', e.name, 'productora_nombre', pr.nombre, 'total', p.total,
    'status', p.status, 'mp_payment_id', p.mp_payment_id
  ) ORDER BY p.created_at DESC), '[]'::jsonb) INTO res
  FROM public.purchases p
  JOIN public.events e ON e.id = p.event_id
  LEFT JOIN public.productoras pr ON pr.id = e.productora_id
  LEFT JOIN public.profiles pf ON pf.id = p.buyer_id
  WHERE p.status NOT IN ('approved','paid');
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_global_search(_q text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE q text; res jsonb;
BEGIN
  PERFORM public.admin_require();
  q := NULLIF(trim(COALESCE(_q,'')), '');
  IF q IS NULL THEN RETURN jsonb_build_object('purchases','[]'::jsonb,'tickets','[]'::jsonb,'users','[]'::jsonb,'events','[]'::jsonb); END IF;

  SELECT jsonb_build_object(
    'purchases', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', p.id, 'created_at', p.created_at,
        'buyer_email', COALESCE(p.buyer_email, pf.email), 'event_name', e.name, 'total', p.total,
        'status', p.status, 'mp_payment_id', p.mp_payment_id)), '[]'::jsonb)
      FROM public.purchases p JOIN public.events e ON e.id = p.event_id
      LEFT JOIN public.profiles pf ON pf.id = p.buyer_id
      WHERE p.buyer_email ILIKE '%'||q||'%' OR p.mp_payment_id ILIKE '%'||q||'%' OR p.id::text ILIKE '%'||q||'%'
         OR pf.email ILIKE '%'||q||'%'
      LIMIT 25),
    'tickets', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', t.id, 'qr_code', t.qr_code, 'status', t.status,
        'used_at', t.used_at, 'event_name', e.name, 'ticket_type', tt.name, 'purchase_id', t.purchase_id,
        'owner_email', COALESCE(t.owner_email, pf.email))), '[]'::jsonb)
      FROM public.tickets t JOIN public.events e ON e.id = t.event_id
      JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
      LEFT JOIN public.profiles pf ON pf.id = t.owner_id
      WHERE t.qr_code ILIKE '%'||q||'%' OR t.owner_email ILIKE '%'||q||'%' OR t.id::text ILIKE '%'||q||'%'
         OR pf.email ILIKE '%'||q||'%'
      LIMIT 25),
    'users', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', pf.id, 'email', pf.email,
        'full_name', pf.full_name, 'dni', pf.dni, 'created_at', pf.created_at, 'suspended', pf.suspended)), '[]'::jsonb)
      FROM public.profiles pf WHERE pf.email ILIKE '%'||q||'%' OR pf.dni ILIKE '%'||q||'%' OR pf.full_name ILIKE '%'||q||'%'
      LIMIT 25),
    'events', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', e.id, 'name', e.name,
        'event_number', e.event_number, 'status', e.status)), '[]'::jsonb)
      FROM public.events e WHERE e.name ILIKE '%'||q||'%' OR e.event_number ILIKE '%'||q||'%'
      LIMIT 25)
  ) INTO res;
  RETURN res;
END;
$$;

-- ============ audit + admin management ============
CREATE OR REPLACE FUNCTION public.admin_audit(_limit int DEFAULT 100, _offset int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE rows jsonb; total bigint;
BEGIN
  PERFORM public.admin_require();
  SELECT COUNT(*) INTO total FROM public.admin_audit_log;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('id', a.id, 'created_at', a.created_at,
    'actor_email', a.actor_email, 'action', a.action, 'entity_type', a.entity_type,
    'entity_id', a.entity_id, 'entity_label', a.entity_label, 'details', a.details)), '[]'::jsonb)
  INTO rows FROM (
    SELECT * FROM public.admin_audit_log ORDER BY created_at DESC
    LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0)
  ) a;
  RETURN jsonb_build_object('rows', rows, 'total', total);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_admins()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE res jsonb;
BEGIN
  PERFORM public.admin_require();
  SELECT COALESCE(jsonb_agg(jsonb_build_object('user_id', ur.user_id, 'email', pf.email,
    'full_name', pf.full_name, 'created_at', ur.created_at) ORDER BY ur.created_at), '[]'::jsonb) INTO res
  FROM public.user_roles ur LEFT JOIN public.profiles pf ON pf.id = ur.user_id
  WHERE ur.role = 'super_admin';
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_admin(_email text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  PERFORM public.admin_require();
  SELECT id INTO uid FROM public.profiles WHERE lower(email) = lower(trim(_email)) LIMIT 1;
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'error', 'user_not_found'); END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, 'super_admin') ON CONFLICT DO NOTHING;
  DELETE FROM public.user_roles WHERE user_id = uid AND role IN ('buyer','organizer');
  PERFORM public.admin_log('admin_granted', 'user', uid::text, _email, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_admin(_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cnt int; lbl text;
BEGIN
  PERFORM public.admin_require();
  IF _user_id = auth.uid() THEN RETURN jsonb_build_object('ok', false, 'error', 'cannot_remove_self'); END IF;
  SELECT COUNT(*) INTO cnt FROM public.user_roles WHERE role = 'super_admin';
  IF cnt <= 1 THEN RETURN jsonb_build_object('ok', false, 'error', 'last_admin'); END IF;
  SELECT email INTO lbl FROM public.profiles WHERE id = _user_id;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin';
  PERFORM public.admin_log('admin_revoked', 'user', _user_id::text, lbl, '{}'::jsonb);
  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============ privileges: signed-in only, never anon ============
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND (p.proname LIKE 'admin\_%' OR p.proname = 'is_super_admin')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
  END LOOP;
END $$;

REVOKE ALL ON FUNCTION public.admin_log(text, text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_require() FROM PUBLIC, anon, authenticated;