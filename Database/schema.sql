
DROP TABLE IF EXISTS Products;


CREATE TABLE Products (
    product_id      INT AUTO_INCREMENT PRIMARY KEY,
    product_name    VARCHAR(100) NOT NULL,
    product_desc    TEXT,
    status          ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft',
    
    -- Audit Columns
    created_by      VARCHAR(50) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(50),
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted      BOOLEAN DEFAULT FALSE,
    
    -- Indexes for better performance
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_created_at (created_at),
    INDEX idx_status_deleted (status, is_deleted)
);

-- Insert sample data
INSERT INTO Products (product_name, product_desc, created_by, status) VALUES
('Product A', 'Description for Product A - This is a comprehensive product with advanced features', 'admin', 'Published'),
('Product B', 'Description for Product B - Another quality product offering', 'admin', 'Draft'),
('Product C', 'Sample archived product', 'editor', 'Archived');

-- Example queries as provided in requirements

-- Insert a New Product
INSERT INTO Products (product_name, product_desc, created_by, status)
VALUES ('Product A', 'Description for Product A', 'admin', 'Draft');

-- Update Product Details
UPDATE Products
SET product_desc = 'Updated description', updated_by = 'editor', status = 'Published'
WHERE product_id = 1;

-- Soft Delete a Product
UPDATE Products
SET is_deleted = TRUE, updated_by = 'admin'
WHERE product_id = 2;

-- Fetch Products to Display Online (Live)
SELECT product_id, product_name, product_desc
FROM Products
WHERE status = 'Published' AND is_deleted = FALSE;

