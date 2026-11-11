-- One-time seed: two NSE picks from the bhavcopy close of 2026-11-09
-- (LAURUSLABS swing setup, SAILIFE intraday setup), as entry/stop price
-- alerts plus planning entries in the trade journal.
--
-- Requires a configured Postgres DATABASE_URL (the app falls back to a
-- disabled database otherwise, see /api/health). Run with:
--   psql "$DATABASE_URL" -f src/db/seed-nse-picks.sql
-- Safe to re-run: existing rows for these two tickers are replaced, not
-- duplicated.

BEGIN;

DELETE FROM price_alerts WHERE ticker IN ('LAURUSLABS', 'SAILIFE');
DELETE FROM trades WHERE ticker IN ('LAURUSLABS', 'SAILIFE') AND status = 'PLANNING';

-- LAURUSLABS — Swing — 52W-high breakout / tight base
-- Trend template 6/6. ~20% above 50DMA (extended): prefer pullback near 2400
-- or size smaller on breakout.
INSERT INTO price_alerts (ticker, exchange, target_type, target_price, status)
VALUES
  ('LAURUSLABS', 'NSE', 'PIVOT_ENTRY', 2485, 'ACTIVE'),
  ('LAURUSLABS', 'NSE', 'STOP_LOSS', 2340, 'ACTIVE');

INSERT INTO trades (ticker, exchange, side, quantity, entry_price, status, opened_at, notes)
VALUES (
  'LAURUSLABS', 'NSE', 'BUY', 1, 2485, 'PLANNING', now(),
  'Swing plan: entry 2485, stop 2340, T1 2775, T2 2920. Trend template 6/6. ~20% above 50DMA (extended): prefer pullback near 2400 or size smaller on breakout.'
);

-- SAILIFE (Sai Life Sciences) — Intraday — Gap-up continuation / 52W-high break
-- Exit if back below 1855 in first 15 min. Alt: retest buy 1836, SL 1795.
INSERT INTO price_alerts (ticker, exchange, target_type, target_price, status)
VALUES
  ('SAILIFE', 'NSE', 'PIVOT_ENTRY', 1898, 'ACTIVE'),
  ('SAILIFE', 'NSE', 'STOP_LOSS', 1855, 'ACTIVE');

INSERT INTO trades (ticker, exchange, side, quantity, entry_price, status, opened_at, notes)
VALUES (
  'SAILIFE', 'NSE', 'BUY', 1, 1898, 'PLANNING', now(),
  'Intraday plan: entry 1898, stop 1855, T1 1941, T2 1984. Trend template 6/6. Exit if back below 1855 in first 15 min. Alt: retest buy 1836, SL 1795.'
);

COMMIT;
