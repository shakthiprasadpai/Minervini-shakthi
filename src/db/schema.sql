CREATE TABLE IF NOT EXISTS watchlists(id BIGSERIAL PRIMARY KEY,name TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS watchlist_items(id BIGSERIAL PRIMARY KEY,watchlist_id BIGINT REFERENCES watchlists(id) ON DELETE CASCADE,ticker TEXT NOT NULL,exchange TEXT NOT NULL,UNIQUE(watchlist_id,ticker,exchange));
CREATE TABLE IF NOT EXISTS portfolio_holdings(id BIGSERIAL PRIMARY KEY,ticker TEXT NOT NULL,exchange TEXT NOT NULL,shares NUMERIC NOT NULL,entry_price NUMERIC NOT NULL,current_price NUMERIC NOT NULL,buy_date DATE NOT NULL,stop_loss_price NUMERIC,pivot_target_price NUMERIC,notes TEXT,created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS trades(id BIGSERIAL PRIMARY KEY,ticker TEXT NOT NULL,exchange TEXT NOT NULL,side TEXT NOT NULL,quantity NUMERIC NOT NULL,entry_price NUMERIC,exit_price NUMERIC,pnl NUMERIC,status TEXT NOT NULL,opened_at TIMESTAMPTZ,closed_at TIMESTAMPTZ,notes TEXT);
CREATE TABLE IF NOT EXISTS price_alerts(id BIGSERIAL PRIMARY KEY,ticker TEXT NOT NULL,exchange TEXT NOT NULL,target_type TEXT NOT NULL,target_price NUMERIC NOT NULL,status TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT now(),triggered_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS screener_runs(id BIGSERIAL PRIMARY KEY,run_at TIMESTAMPTZ DEFAULT now(),universe_count INTEGER NOT NULL,result_count INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON portfolio_holdings(ticker);
