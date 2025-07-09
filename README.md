# 🌾 Farmly

**Fresh farm food for your family.**

Farmly is a web-based platform that allows customers to pre-order fresh, high-quality farm produce directly from local farms in Delta State, Nigeria. The system enables scheduled delivery to Lagos, ensuring better food access, less waste, and fairer prices for both farmers and consumers.

---

## 📦 Features

- 🛒 Browse fresh farm produce (yam, garri, palm oil, etc.)
- 📦 Add multiple items with quantity and unit tracking
- 🚚 Choose between Standard (1 week) or Express (3 days) delivery
- 💳 Pay securely via Paystack
- 📩 Receive email confirmation of your order
- 📊 Admin backend using Google Sheets for live updates

---

## 🧱 Architecture

| Layer        | Technology Used                          |
| ------------ | ---------------------------------------- |
| Frontend     | HTML, CSS, JavaScript                    |
| Backend (Data) | Google Sheets via Google Apps Script     |
| Backend (Orders) | SheetDB (Webhook to Google Sheets)     |
| Payments     | Paystack                                 |
| Email        | Gmail App Script API                     |
| Hosting      | GitHub Pages                             |

---

## 📁 Folder Structure

📦 farmly/
├── index.html
├── shop.html
├── about.html
├── contact.html
├── css/
│ ├── home.css
│ ├── shop.css
│ ├── about.css
│ ├── contact.css
│ └── typography.css
├── js/
│ └── shop.js
├── images/
│ └── (product images and assets)
└── README.md

---

## 🚀 Getting Started

1. **Clone this repository**  
```bash
git clone https://github.com/BlackTeji/Farmly

Open index.html in your browser or deploy using GitHub Pages

Connect Google Sheets

Use Google Apps Script to pull product data

Use SheetDB for order form submissions to your Sheet

Set up Paystack

Create a Paystack Account

Replace the test key in shop.js with your live/public key

---

## ✅ Progress Report

🎯 Achievements

Clean, responsive multi-page layout

Working Paystack payment integration

Real-time product display from Google Sheets

Order form with delivery timeline and email confirmation

⚠️ Challenges

CORS issues with Google Apps Script POST requests

Layout bugs on iPhone Safari viewports

Sync delays with SheetDB webhook and backend

🧠 Lessons Learned

Practical API integration using low-code tools

How to resolve real-world frontend bugs

Git version control and collaborative workflow

---

## 👨‍💻 Developed By
Martinez Esiekpe