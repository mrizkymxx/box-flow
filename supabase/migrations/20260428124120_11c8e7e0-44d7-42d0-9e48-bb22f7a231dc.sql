
CREATE OR REPLACE FUNCTION public.recalc_so_totals()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE so_id UUID; tot_prod INT; tot_rej INT; ord INT;
BEGIN
  so_id := COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  SELECT COALESCE(SUM(qty_produced),0), COALESCE(SUM(qty_reject),0) INTO tot_prod, tot_rej
    FROM public.production_logs WHERE sales_order_id = so_id;
  SELECT qty_order INTO ord FROM public.sales_orders WHERE id = so_id;
  UPDATE public.sales_orders
    SET qty_produced = tot_prod,
        qty_reject = tot_rej,
        status = CASE
          WHEN tot_prod >= ord AND ord > 0 THEN 'completed'::so_status
          WHEN tot_prod > 0 THEN 'partial'::so_status
          ELSE status
        END
  WHERE id = so_id;
  RETURN COALESCE(NEW, OLD);
END; $$;
