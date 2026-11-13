DROP TABLE IF EXISTS subscriptions, support_tickets, reviews, `returns`, shipments, payments, order_items, orders, coupons, products, categories, customers;

CREATE TABLE customers (
  customer_id int PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  full_name varchar(255) NOT NULL,
  country char(2) NOT NULL,
  segment enum('consumer', 'business', 'wholesale') NOT NULL,
  created_at timestamp(3) NOT NULL
) COMMENT 'Customers';

CREATE TABLE categories (
  category_id int PRIMARY KEY,
  name varchar(255) NOT NULL UNIQUE,
  description text NOT NULL
) COMMENT 'Categories';

CREATE TABLE products (
  product_id int PRIMARY KEY,
  category_id int NOT NULL,
  sku varchar(64) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  unit_price decimal(10, 2) NOT NULL COMMENT 'Price (USD)' CHECK (unit_price >= 0),
  unit_cost decimal(10, 2) NOT NULL COMMENT 'Cost (USD)' CHECK (unit_cost >= 0),
  stock_quantity int NOT NULL CHECK (stock_quantity >= 0),
  reorder_level int NOT NULL CHECK (reorder_level >= 0),
  rating_avg decimal(3, 2) CHECK (rating_avg BETWEEN 1 AND 5),
  is_active tinyint(1) NOT NULL,
  created_at timestamp(3) NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (category_id)
) COMMENT 'Products';

CREATE TABLE coupons (
  coupon_id int PRIMARY KEY,
  code varchar(64) NOT NULL UNIQUE,
  description text NOT NULL,
  discount_percent int NOT NULL COMMENT 'Discount (percent)' CHECK (discount_percent BETWEEN 1 AND 100),
  starts_at timestamp(3) NOT NULL,
  expires_at timestamp(3) NOT NULL,
  is_active tinyint(1) NOT NULL,
  times_redeemed int NOT NULL CHECK (times_redeemed >= 0)
) COMMENT 'Coupons';

CREATE TABLE orders (
  order_id int PRIMARY KEY,
  customer_id int NOT NULL,
  coupon_id int,
  status enum('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') NOT NULL,
  channel enum('web', 'marketplace', 'retail') NOT NULL,
  subtotal_amount decimal(10, 2) NOT NULL COMMENT 'Subtotal (USD)',
  discount_amount decimal(10, 2) NOT NULL COMMENT 'Discount (USD)',
  shipping_amount decimal(10, 2) NOT NULL COMMENT 'Shipping (USD)',
  total_amount decimal(10, 2) NOT NULL COMMENT 'Total (USD)',
  created_at timestamp(3) NOT NULL,
  INDEX orders_created_at_idx (created_at),
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  FOREIGN KEY (coupon_id) REFERENCES coupons (coupon_id)
) COMMENT 'Orders';

CREATE TABLE order_items (
  order_item_id int PRIMARY KEY,
  order_id int NOT NULL,
  product_id int NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  unit_price decimal(10, 2) NOT NULL COMMENT 'Unit price (USD)',
  line_total decimal(10, 2) NOT NULL COMMENT 'Line total (USD)',
  FOREIGN KEY (order_id) REFERENCES orders (order_id),
  FOREIGN KEY (product_id) REFERENCES products (product_id)
) COMMENT 'Order items';

CREATE TABLE payments (
  payment_id int PRIMARY KEY,
  order_id int NOT NULL,
  method enum('card', 'paypal', 'apple_pay', 'bank_transfer') NOT NULL,
  status enum('pending', 'captured', 'failed', 'refunded') NOT NULL,
  amount decimal(10, 2) NOT NULL COMMENT 'Amount (USD)',
  paid_at timestamp(3) NULL,
  created_at timestamp(3) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders (order_id)
) COMMENT 'Payments';

CREATE TABLE shipments (
  shipment_id int PRIMARY KEY,
  order_id int NOT NULL,
  carrier enum('ups', 'fedex', 'dhl', 'usps') NOT NULL,
  tracking_number varchar(64) NOT NULL,
  status enum('in_transit', 'delayed', 'delivered') NOT NULL,
  shipped_at timestamp(3) NOT NULL,
  delivered_at timestamp(3) NULL,
  delay_days int NOT NULL CHECK (delay_days >= 0),
  FOREIGN KEY (order_id) REFERENCES orders (order_id)
) COMMENT 'Shipments';

CREATE TABLE `returns` (
  return_id int PRIMARY KEY,
  order_id int NOT NULL,
  reason enum('damaged_in_transit', 'wrong_item', 'not_as_described', 'changed_mind', 'defective') NOT NULL,
  status enum('requested', 'approved', 'received', 'refunded', 'rejected') NOT NULL,
  refund_amount decimal(10, 2) NOT NULL COMMENT 'Refund (USD)',
  created_at timestamp(3) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders (order_id)
) COMMENT 'Returns';

CREATE TABLE reviews (
  review_id int PRIMARY KEY,
  product_id int NOT NULL,
  customer_id int NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title varchar(255) NOT NULL,
  body text NOT NULL,
  created_at timestamp(3) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products (product_id),
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
) COMMENT 'Reviews';

CREATE TABLE support_tickets (
  ticket_id int PRIMARY KEY,
  customer_id int NOT NULL,
  order_id int,
  subject varchar(255) NOT NULL,
  priority enum('low', 'normal', 'high', 'urgent') NOT NULL,
  status enum('open', 'pending', 'resolved', 'closed') NOT NULL,
  assignee varchar(255),
  created_at timestamp(3) NOT NULL,
  resolved_at timestamp(3) NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  FOREIGN KEY (order_id) REFERENCES orders (order_id)
) COMMENT 'Support tickets';

CREATE TABLE subscriptions (
  subscription_id int PRIMARY KEY,
  customer_id int NOT NULL,
  product_id int NOT NULL,
  plan enum('monthly', 'bimonthly', 'quarterly') NOT NULL,
  status enum('active', 'paused', 'cancelled') NOT NULL,
  price_per_delivery decimal(10, 2) NOT NULL COMMENT 'Price per delivery (USD)',
  started_at timestamp(3) NOT NULL,
  next_delivery_at timestamp(3) NULL,
  cancelled_at timestamp(3) NULL,
  FOREIGN KEY (customer_id) REFERENCES customers (customer_id),
  FOREIGN KEY (product_id) REFERENCES products (product_id)
) COMMENT 'Subscriptions';
