-- Allow anonymous users to view invoices (for portal access)
-- The portal validates token ownership separately before returning data
CREATE POLICY "Anon can view invoices" ON invoices
  FOR SELECT
  TO anon
  USING (true);

-- Also allow anon to view invoice_line_items for full invoice details
CREATE POLICY "Anon can view invoice_line_items" ON invoice_line_items
  FOR SELECT
  TO anon
  USING (true);

-- And payments for payment history
CREATE POLICY "Anon can view payments" ON payments
  FOR SELECT
  TO anon
  USING (true);
