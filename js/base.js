(function(window) {
    // Create the blank global variable
    window.StripeShop = {};

    document.addEventListener("DOMContentLoaded", function() {
        // copy the plugin's settings into the variable (required for the stripe key and urls)
        StripeShop.settings = window.PLUGIN_STRIPE_CHECKOUT.settings || {};
        // Unused for now - could be used for adding variable text translations
        StripeShop.translations = window.PLUGIN_STRIPE_CHECKOUT.strings || {};
    });

})(window);

(function(StripeShop) {

    // The plugin leverages localStorage https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
    // It uses localstorage to keep users's carts saved so they can be picked up even if they leave the website.
    // So, first thing we do is pull items from the storage, and if none exist, empty the cart.
    StripeShop.items = JSON.parse(localStorage.getItem('stripe-shop-items')) || [];

    /***********************************************************/
    /* Add a product to the cart
    /*
    /* This is the main function of the plugin, can be used via
    /* StripeShop.addProduct('sku_here', quantity, extras)
    /* Quantity can be a positive or negative number (negative will
    /* reduce the quantity - at 0 or less, item gets removed)
    /* Extras can be any other product information you need to store,
    /* such as images, product routes, etc.
    /***********************************************************/
    StripeShop.addProduct = function addProduct(sku, quantity, extras = null)
    {
        // Check if product already in the cart
        const products = (StripeShop.items).filter(function(item) {
            return item.sku === sku;
        });
        const product = products[0];

        if (!product) {
            // if no product, create one by pushing to the array
            if (extras) {
                // any extras? add them too or skip them
                StripeShop.items.push({sku: sku, quantity: quantity, extras: extras});
            } else {
                StripeShop.items.push({sku: sku, quantity: quantity});
            }

            console.log('Added ' + quantity + ' of ' + sku);
        } else {
            // product exists -> update the quantity
            product.quantity = parseInt(product.quantity) + parseInt(quantity);

            if (extras) {
                // any extras? add them
                product.extras = extras;
            }

            console.log('Changed quantity of ' + sku + ' by: ' + quantity);
        }

        if (product && product.quantity <= 0) {
            // Quantity now at or below 0? remove the product
            console.log('Quantity at 0, removing product.');
            StripeShop.removeProduct(product.sku);
            return;
        }

        console.log(StripeShop.items);
        StripeShop._saveToLocalStorage();
    };

    /***********************************************************/
    /* Redirect to Stripe Shop
    /*
    /* The function that sends the user to the Stripe payment page
    /* This function can output error messages if you create an
    /* element with ID="error-message". It requires the stripe
    /* public key set in the plugin configs as well as the success
    /* and cancel urls.
    /***********************************************************/
    StripeShop.goToCheckout = function goToCheckout()
    {
        const stripe = Stripe(StripeShop.settings.key);

        if (StripeShop.settings.shipping_countries != undefined){
            const stripeParams = {

                lineItems: StripeShop.getOrderItems(),
                mode: 'payment',
                shippingAddressCollection: {
                        allowedCountries: StripeShop.settings.shipping_countries,
                    },
                successUrl: StripeShop.settings.success_url,
                cancelUrl: StripeShop.settings.cancel_url
    
            };
        }

        const stripeParams = {
            lineItems: StripeShop.getOrderItems(),
            mode: 'payment',
            successUrl: StripeShop.settings.success_url,
            cancelUrl: StripeShop.settings.cancel_url
        };
        
        stripe.redirectToCheckout(stripeParams)
        .then(function (result) {

            if (result.error) {
                // If `redirectToCheckout` fails due to a browser or network
                // error, display the localized error message to your customer.
                const displayError = document.getElementById('error-message');
                displayError.textContent = result.error.message;
            }

        });
    };

    /***********************************************************/
    /* Get Checkout Items - formatted for Stripe API
    /*
    /* A function to format the items ready for the redirectToCheckout()
    /* this function will just remove the extras for all the items
    /* to avoid any errors thrown by Stripe
    /***********************************************************/
    StripeShop.getOrderItems = function getOrderItems()
    {
        let items = [];
        (StripeShop.items).forEach(item =>
            items.push({
                price: item.sku,
                quantity: item.quantity,
            })
        );

        return items;
    };

    /***********************************************************/
    /* Get a product from the cart
    /*
    /* Returns a product object
    /***********************************************************/
    StripeShop.getProduct = function getProduct(sku)
    {
        const index = (StripeShop.items).findIndex(item => item.sku === sku);
        return StripeShop.items[index];
    };

    /***********************************************************/
    /* Remove a product from the cart
    /*
    /* Attempts to remove the requested SKU from the cart, does
    /* nothing if SKU not found. Updates localStorage
    /***********************************************************/
    StripeShop.removeProduct = function removeProduct(sku)
    {
        const index = (StripeShop.items).findIndex(item => item.sku === sku);

        if (index === -1) {
            console.log('Product ' + sku + ' not in cart. Nothing removed.');
            return;
        }

        (StripeShop.items).splice(index, 1);

        console.log('Product ' + sku + ' removed.', StripeShop.items);
        StripeShop._saveToLocalStorage();
    };

    /***********************************************************/
    /* Save the shopping cart to the local storage
    /***********************************************************/
    StripeShop._saveToLocalStorage = function _saveToLocalStorage()
    {
        localStorage.setItem('stripe-shop-items', JSON.stringify(StripeShop.items));
    };

    /***********************************************************/
    /* Grabs the shopping cart from the local storage
    /***********************************************************/
    StripeShop._getFromLocalStorage = function _getFromLocalStorage()
    {
        return JSON.parse(localStorage.getItem('stripe-shop-items'));
    };

    /***********************************************************/
    /* Clear the shopping cart
    /***********************************************************/
    StripeShop.clearCart = function clearCart()
    {
        StripeShop.items = [];
        localStorage.removeItem('stripe-shop-items');

        console.log('Cart & local storage has been cleared');
        StripeShop._saveToLocalStorage();
    };

    /***********************************************************/
    /* Increase item quantity
    /***********************************************************/
    StripeShop.increaseQuantity = function increaseQuantity(sku, quantity)
    {
        StripeShop.addProduct(sku, quantity);
    };

    /***********************************************************/
    /* Decrease Item Quantity
    /***********************************************************/
    StripeShop.decreaseQuantity = function decreaseQuantity(sku, quantity)
    {
        quantity = Math.sign(quantity) === -1 ? quantity : -(quantity);
        StripeShop.addProduct(sku, quantity);
    };


    /***********************************************************/
    /* Search URL queries - Helper function
    /*
    /* A function to read URL query strings. example.com?test=blabla
    /* Usage:
    /* StripeShop.getUrlParameter('test') returns 'blabla'
    /***********************************************************/
    StripeShop.getUrlParameter = function getUrlParameter(sParam) {
        let sPageURL = window.location.search.substring(1),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i++) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
            }
        }
    };
    
})(window.StripeShop);
