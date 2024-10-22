# Farm Stand App - Nutmeggs



I moved to the country a few years ago and I couldn't be happier. One of the reasons I love it so much out here is the community... another big reason is the abundant farm fresh food! We love being able to pick up eggs (and veggies and bread and so much more) from our neighbors’ local farm stands, but we aren’t always able to find what we’re looking for easily (or without driving around a bunch). I'm an amateur/hobbyist programmer looking for problems to tackle (and excuses to improve my skills), so I built a simple web application that I wanted to share with you all in the hopes that it might make it just a little easier for folks with farm stands to connect with folks who want farm fresh food - myself included! I called it NutmEggs 😃 - here's the github repo.

## How to use the app:
Vendors click sign up at the top of the page, enter their farm stand name, their email and their desired password. They’ll receive an automated email with a confirmation link. After they confirm by clicking the link, they’ll be able to log in to their “Vendor Dashboard” and set the address of their farm stand (as well as a note to help people find it). Note: The vendor page will be invisible to users until the address is selected! Once you’ve saved your address, you can add names of the items you offer (Chicken/Duck Eggs, Bread/Bagels, Veggies, Flowers, etc) and how much stock is available. Finally, there is an option to generate a unique QR code that you can print out and leave at your farm stand so that people can scan it and update the stock remaining after their purchase.
Users will be able to see vendors page on the map displayed on the main page. Green icons indicate there is some stock (of at least one item) available, red icons indicate sold out. Users will also be able to click on the icon to show address/stocked items/navigation options and vendor details page. Users will be able to adjust the stock of any item without being logged in - I figured since these generally run on the honor system, it made sense to allow people to update the stock without having to create an account or restrict only vendors to be able to update their own stock.

I would LOVE any feedback from anyone about this - don’t worry about hurting my feelings! As I said, I’m not a professional web developer by any means; in fact, this is my first public web application! Although I have a tech background, I never studied programming formally, and I relied heavily on ChatGPT for development of the app. I'm really just hoping to reduce friction and increase efficiency in small ways that make our lives just a little bit easier wherever I can.

If you have any questions, or need any help, please let me know/create an issue and I’d be happy to try. Additionally, you can modify the source code freely... This app will be 100% free forever. I REALLY dislike how so many helpful tools are often provided for free at first (usually so that they can harvest our data) and then, once we’re locked in and depend on those tools, they start charging for them.

Thanks for taking the time to read this and I hope you take a few minutes to check out the app.

## Run your own
Use Docker compose! You'll need to add your Google Maps API key as well as your Firebase API and project info to your .env file.

Then run:
```
docker compose up --build
```
Have fun!
