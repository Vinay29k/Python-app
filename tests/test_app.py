"""
Unit tests for AURA Luxe Atelier Flask application.
Suitable for CI/CD test runner execution.
"""

import unittest
import json
import sys
import os

# Add parent directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app

class TestAuraApp(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_homepage_route(self):
        """Test homepage renders successfully with HTTP 200."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'AURA', response.data)

    def test_api_products_list(self):
        """Test API returns all catalog products."""
        response = self.client.get('/api/products')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertGreater(data['count'], 0)
        self.assertIsInstance(data['products'], list)

    def test_api_products_category_filter(self):
        """Test API filters products by category."""
        response = self.client.get('/api/products?category=watches')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        for prod in data['products']:
            self.assertEqual(prod['category'], 'watches')

    def test_api_single_product(self):
        """Test fetching a single product by ID."""
        response = self.client.get('/api/products/1')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['product']['id'], 1)

    def test_api_single_product_not_found(self):
        """Test 404 response for invalid product ID."""
        response = self.client.get('/api/products/99999')
        self.assertEqual(response.status_code, 404)

    def test_api_checkout_success(self):
        """Test checkout endpoint with items."""
        payload = {
            "items": [
                {"id": 1, "price": 1450.00, "quantity": 1}
            ]
        }
        response = self.client.post('/api/checkout', 
                                   data=json.dumps(payload),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'success')
        self.assertIn('AURA-', data['orderId'])

    def test_api_checkout_empty_cart(self):
        """Test checkout endpoint fails gracefully with empty cart."""
        response = self.client.post('/api/checkout', 
                                   data=json.dumps({}),
                                   content_type='application/json')
        self.assertEqual(response.status_code, 400)

if __name__ == '__main__':
    unittest.main()
