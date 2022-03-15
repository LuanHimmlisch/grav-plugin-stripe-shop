(function (StripeShop) {

    var itemsNumber = 0;

    StripeShop.uiUpdateItemsBy = (plusItems) => {
        StripeShop.itemsNumber += plusItems;
        StripeShop.uiUpdate();
    }

    StripeShop.uiUpdateItems = () => {
        StripeShop.itemsNumber = 0;

        StripeShop.items.forEach(item => {
            StripeShop.itemsNumber += item.quantity;
        });
        StripeShop.uiUpdate();
    }
})(window.StripeShop);

// This is not the best of doing this but meh....
// Fix this if you want
window.onload = () => {
    StripeShop.uiUpdate = () => {
        const itemsNumberDOM = document.getElementById("shop-cart-items");
        if (itemsNumberDOM == null) {
            return
        }

        itemsNumberDOM.innerHTML = StripeShop.itemsNumber;
    }
    StripeShop.uiUpdateItems()
};