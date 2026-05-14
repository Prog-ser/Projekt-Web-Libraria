let books = [];
let cart = [];

const form = document.querySelector(".search-form");
const input = document.querySelector("#search-books");
const grid = document.querySelector("#book-grid");
const cartButton = document.querySelector(".cart-button");
const cartCount = document.querySelector(".cart-count");
const popup = document.querySelector("#cart-popup");
const cartItems = document.querySelector("#cart-items");
const closeCart = document.querySelector("#close-cart");
const checkoutButton = document.querySelector("#checkout-btn");
const checkout = document.querySelector("#checkout");
const orderButton = document.querySelector("#order-btn");
const orderMessage = document.querySelector("#order-message");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (input.value.trim() === "") return;

    grid.innerHTML = "<p>Loading...</p>";

    try {
        const response = await fetch("https://openlibrary.org/search.json?q=" + encodeURIComponent(input.value) + "&limit=12");
        const data = await response.json();

        books = data.docs
            .filter(function (book) {
                return book.cover_i;
            })
            .slice(0, 9)
            .map(function (book, index) {
                return {
                    title: clean(book.title),
                    image: "https://covers.openlibrary.org/b/id/" + book.cover_i + "-M.jpg",
                    price: "$" + (9 + index * 2) + ".99"
                };
            });

        if (books.length === 0) {
            grid.innerHTML = "<p>No books found.</p>";
            return;
        }

        grid.innerHTML = books.map(function (book, index) {
            return `
                <article class="book-card">
                    <div class="book-cover"><img src="${book.image}" alt="Book cover"></div>
                    <div class="book-content">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-price">${book.price}</p>
                        <button class="add-cart-button" data-index="${index}">Add to cart</button>
                    </div>
                </article>
            `;
        }).join("");
    } catch {
        grid.innerHTML = "<p>Could not load books.</p>";
    }
});

grid.addEventListener("click", function (event) {
    if (event.target.className !== "add-cart-button") return;

    cart.push(books[event.target.dataset.index]);
    renderCart();
});

cartButton.addEventListener("click", showCart);

closeCart.addEventListener("click", function () {
    popup.classList.remove("show");
});

checkoutButton.addEventListener("click", function () {
    popup.classList.remove("show");
    checkout.hidden = false;
    checkout.scrollIntoView();
});

orderButton.addEventListener("click", function () {
    const name = document.querySelector("#customer-name").value.trim();
    const address = document.querySelector("#customer-address").value.trim();

    if (name === "" || address === "" || cart.length === 0) {
        orderMessage.textContent = "Add books, name, and address first.";
        return;
    }

    orderMessage.textContent = "Thank you, " + name + ". Your order will be sent to " + address + ".";
    cart = [];
    renderCart();
    popup.classList.remove("show");
});

function showCart() {
    renderCart();
    popup.classList.add("show");
}

function renderCart() {
    cartCount.textContent = cart.length;
    checkoutButton.disabled = cart.length === 0;
    cartItems.innerHTML = cart.length
        ? cart.map(function (book) {
            return "<p>" + book.title + " - " + book.price + "</p>";
        }).join("")
        : "<p>Your cart is empty.</p>";
}

function clean(text) {
    return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
