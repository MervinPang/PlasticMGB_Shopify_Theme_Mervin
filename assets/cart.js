/**
 * AJAX Cart operations for Plastic MGB Shopify theme.
 * Handles add-to-cart without page reload and updates the header cart badge.
 */

(function() {
  'use strict';

  var CartAPI = {
    /**
     * Add an item to the cart via AJAX.
     * @param {number} variantId - Shopify variant ID
     * @param {number} quantity - Quantity to add
     * @returns {Promise}
     */
    add: function(variantId, quantity) {
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity || 1
        })
      }).then(function(res) {
        if (!res.ok) throw new Error('Add to cart failed');
        return res.json();
      }).then(function(data) {
        CartAPI.updateBadge();
        return data;
      });
    },

    /**
     * Update a line item quantity.
     * @param {number} line - 1-indexed line number
     * @param {number} quantity - New quantity (0 to remove)
     * @returns {Promise}
     */
    change: function(line, quantity) {
      return fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line: line,
          quantity: quantity
        })
      }).then(function(res) {
        return res.json();
      }).then(function(cart) {
        CartAPI.updateBadge(cart.item_count);
        return cart;
      });
    },

    /**
     * Get current cart state.
     * @returns {Promise}
     */
    get: function() {
      return fetch('/cart.js').then(function(res) {
        return res.json();
      });
    },

    /**
     * Update the cart count badge in the header.
     * @param {number} [count] - Optional count; if omitted, fetches from API
     */
    updateBadge: function(count) {
      function setBadge(c) {
        var badge = document.getElementById('cart-count-badge');
        if (badge) {
          badge.textContent = c;
          badge.style.display = c > 0 ? '' : 'none';
        }
      }

      if (typeof count === 'number') {
        setBadge(count);
      } else {
        CartAPI.get().then(function(cart) {
          setBadge(cart.item_count);
        });
      }
    }
  };

  /* Expose globally */
  window.CartAPI = CartAPI;

  /* Handle AJAX quantity changes on cart page */
  document.addEventListener('DOMContentLoaded', function() {
    var qtyInputs = document.querySelectorAll('.cart-quantity-input');
    qtyInputs.forEach(function(input) {
      input.addEventListener('change', function() {
        var line = parseInt(this.getAttribute('data-line'));
        var qty = parseInt(this.value);
        if (isNaN(qty) || qty < 0) qty = 0;
        CartAPI.change(line, qty).then(function() {
          window.location.reload();
        });
      });
    });

    /* Handle remove links on cart page */
    var removeLinks = document.querySelectorAll('.cart-remove-link');
    removeLinks.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        var params = new URLSearchParams(href.split('?')[1]);
        var line = parseInt(params.get('line'));
        CartAPI.change(line, 0).then(function() {
          window.location.reload();
        });
      });
    });
  });
})();
