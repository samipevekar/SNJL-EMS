-- shop table
CREATE TABLE shops (
	id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL UNIQUE,
    shop_name VARCHAR(255) NOT NULL,
    MGQ JSONB NOT NULL ,
    yearly_mgq INTEGER, 
    monthly_mgq INTEGER, 
	liquor_type VARCHAR(20) CHECK (liquor_type IN ('country', 'foreign')) NOT NULL,
    mgq_q1 INTEGER DEFAULT 0,  
    mgq_q2 INTEGER DEFAULT 0,  
    mgq_q3 INTEGER DEFAULT 0,  
    mgq_q4 INTEGER DEFAULT 0,
    canteen INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- sale_sheets table
CREATE TABLE sale_sheets (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(shop_id) ON DELETE CASCADE,
    liquor_type VARCHAR(20) CHECK (liquor_type IN ('country', 'foreign', 'beer')) NOT NULL, -- Country ya Foreign liquor
    brand_name VARCHAR(255) NOT NULL, -- Brand ka naam (e.g., Kingfisher, Tuborg)
    opening_balance INTEGER NOT NULL,
    sale INTEGER NOT NULL,
    stock_increment JSONB DEFAULT '[]', -- Multiple brands ka stock store karne ke liye
    mrp INTEGER NOT NULL DEFAULT 70,
    daily_sale INTEGER,
    closing_balance INTEGER,
    expenses JSONB DEFAULT '[]', -- Array of {amount, message}
    upi INTEGER DEFAULT 0, -- User input karega ki kitna amount UPI se pay hua
    net_cash INTEGER, -- Total cash before UPI deduction
    cash_in_hand INTEGER GENERATED ALWAYS AS (net_cash - upi) STORED, -- Auto-calculated
    canteen INTEGER NOT NULL DEFAULT 100, -- Constant value
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- brands table

CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(255) NOT NULL UNIQUE,
    liquor_type VARCHAR(20) NOT NULL CHECK (liquor_type IN ('country', 'foreign')),
    category VARCHAR(50) NOT NULL,
    packaging_type VARCHAR(50) NOT NULL,
    volume_ml INTEGER NOT NULL,
    pieces_per_case INTEGER NOT NULL,
    cost_price_per_case NUMERIC(10, 2) NOT NULL,
    mrp_per_unit NUMERIC(10, 2) NOT NULL,
    duty NUMERIC(10, 2) NOT NULL,
    mrp_per_case NUMERIC(10, 2) NOT NULL,
    profit NUMERIC(10, 2) GENERATED ALWAYS AS (mrp_per_case - cost_price_per_case) STORED
);

-- stock_increments table
CREATE TABLE stock_increments (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(shop_id) ON DELETE CASCADE,
    bill_id INTEGER NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    volume_ml INTEGER NOT NULL,
    warehouse_name VARCHAR(255) NOT NULL,
    cases INTEGER NOT NULL,
    pieces INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- daily_sales_summary table
CREATE TABLE daily_sales_summary (
    id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(shop_id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    liquor_type VARCHAR(20) NOT NULL,
    total_net_cash INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--indent_information table  
CREATE TABLE indent_information (
    indent_id SERIAL PRIMARY KEY,
    shop_id INTEGER REFERENCES shops(shop_id) ON DELETE CASCADE,
    shop_name VARCHAR(250) NOT NULL,
    brand JSONB NOT NULL,
    total_cases INTEGER NOT NULL,
    total_duty NUMERIC(10, 2) NOT NULL,        -- float value ke liye
    total_cost_price NUMERIC(10, 2) NOT NULL,  -- float value ke liye
    indent_date DATE NOT NULL DEFAULT CURRENT_DATE
);


-- w_stock table
CREATE table w_stock (
	id SERIAL PRIMARY KEY,
    shop_id INTEGER NOT NULL,
	bill_id INTEGER NOT NULL,
	warehouse_name VARCHAR(255) NOT NULL,
	brand VARCHAR(200) NOT NULL,
	cases INTEGER NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)  NOT NULL,
    email VARCHAR(300) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    face_encoding TEXT,
    role VARCHAR(20) CHECK (role IN ('user', 'manager', 'super_user')) DEFAULT 'user',
    users ADD COLUMN assigned_shops INTEGER[] DEFAULT '{}';
);

-- expenses table
CREATE TABLE manageral_expenses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    shop_id INT REFERENCES shops(shop_id) ON DELETE CASCADE,
    amount INT NOT NULL,
    liquor_type VARCHAR(20) CHECK (liquor_type IN ('country', 'foreign')) NOT NULL,
    message TEXT, 
    expense_date TIMESTAMP DEFAULT NOW()
);

-- payments table
CREATE TABLE warehouse_payments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    shop_id INT REFERENCES shops(shop_id) ON DELETE CASCADE,
    warehouse_name VARCHAR(255),
    bill_id INT,
    brand VARCHAR(255),
    liquor_type VARCHAR(20) CHECK (liquor_type IN ('country', 'foreign')) NOT NULL,
    cases INT,
	amount INT NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW()
);

-- balance_sheets table
CREATE TABLE balance_sheets (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,  -- "all" ya shop_id store karega
    date DATE NOT NULL,
    details TEXT NOT NULL,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    sale_sheet_id integer,
    manageral_expense_id INT REFERENCES manageral_expenses(id) ON DELETE SET NULL;
    warehouse_payment_id INT REFERENCES warehouse_payments(id) ON DELETE SET NULL;
);

CREATE TABLE warehouse_balance_sheets (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,  -- "all" ya warehouse_name store karega
    date DATE NOT NULL,
    details TEXT NOT NULL,
    debit NUMERIC DEFAULT 0,
    credit NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    sale_sheet_id integer,
    warehouse_payment_id INT REFERENCES warehouse_payments(id) ON DELETE SET NULL,
    stock_increment_id INTEGER REFERENCES stock_increments(id) ON DELETE SET NULL;
);



-- attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE
);