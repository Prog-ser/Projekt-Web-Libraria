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
const authPopup = document.querySelector("#auth-popup");
const authForm = document.querySelector("#auth-form");
const authMessage = document.querySelector("#auth-message");

fetch("auth.php?action=check")
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        if (data.admin) location.href = "admin.html";
        if (data.logged) authPopup.classList.remove("show");
    });

document.querySelector("#login-btn").addEventListener("click", function () {
    sendAuth("login");
});

document.querySelector("#signin-btn").addEventListener("click", function () {
    sendAuth("signup");
});

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
                    price: randomPrice()
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
                        <p class="book-price">$${book.price}</p>
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
    if (!event.target.classList.contains("add-cart-button")) return;

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

    const formData = new FormData();
    formData.append("action", "order");
    formData.append("name", name);
    formData.append("books", cart.map(function (book) {
        return book.title;
    }).join(", "));
    formData.append("total", getTotal());

    fetch("auth.php", { method: "POST", body: formData })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            orderMessage.textContent = data.message;
            if (!data.ok) return;
            cart = [];
            renderCart();
            popup.classList.remove("show");
        });
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
            return "<p>" + book.title + " - $" + book.price + "</p>";
        }).join("") + "<p><strong>Total: $" + getTotal() + "</strong></p>"
        : "<p>Your cart is empty.</p>";
}

function clean(text) {
    return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function randomPrice() {
    return (Math.random() * 15 + 10).toFixed(2);
}

function getTotal() {
    return cart.reduce(function (sum, book) {
        return sum + Number(book.price);
    }, 0).toFixed(2);
}

function sendAuth(action) {
    if (!authForm.checkValidity()) {
        authForm.reportValidity();
        return;
    }

    const formData = new FormData(authForm);
    formData.append("action", action);

    fetch("auth.php", { method: "POST", body: formData })
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            authMessage.textContent = data.message;
            if (!data.ok) return;
            if (data.admin) location.href = "admin.html";
            else authPopup.classList.remove("show");
        });
}
