youtube example with credit card paypal payment :- Node.js Express Paypal Advanced Debit & Card Checkout to Sell Digital Goods Using Smart Buttons
we can integrate in two ways
using sdk ( npm library of paypal )
using Rest apis of paypal ( using axios to call api )
account setup :-
create main account
click on developer 
click on sandbox accounts
add business account in sandbox mode

create App in sandbox account
create app as merchant
now open that App and you can see webhook after several scroll
you can add webhook endpoint in that App


now account is setup successfully
open link for more information ⇒ Integrate | PayPal Standard Checkout
you can test here as online as all payment method

for one time payment
you need to ⇒ 
generate Access token via secret key & client id
create order ( use clientId & secretId of sand box )
capture payment in webhook after call ⇒ CHECKOUT.ORDER.APPROVED
means u need to set call capture api in webhook in side if(event_type == CHECKOUT.ORDER.APPROVED)

flow for one time payment you can see in image
notes for paypal :- 
payment lenar nu acc business sandbox acc and created app of paypal bnne as merchant hovu joyye
paypal ma buyer and seller(merchant) bnne acc Indian hse to work krse nhi ( due to government rule)
generally paypal charges 3.49% + 0.49 fixed ⇒
check paypal fees ⇒ Fees | Merchant and Business | PayPal US


for check on paypal website ⇒
integrat with sdk:-Integrate | PayPal Standard Checkout
integrat with apis:- Orders
also about webhook :- Webhooks simulator
rest api paypal integration code  :- 
paypal integrate using Rest api
create order in paypal
call webhook on ⇒ 
event.event_type === "CHECKOUT.ORDER.APPROVED"
call payment capture api for getting payment after CHECKOUT.ORDER.APPROVED webhook  ⇒
https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture
install ⇒ npm i @paypal/checkout-server-sdk
 // paypal demo as github lac
 paypalOn: async (req, res) => {
   try {
     async function generateAccessToken() {
       const response = await axios({
         url: process.env.PAYPAL_API + "/v1/oauth2/token",
         method: "post",
         data: "grant_type=client_credentials",
         auth: {
           username: process.env.CLIENT_ID,
           password: process.env.CLIENT_SECRET,
         },
       });


       return response.data.access_token;
     }


     const accessToken = await generateAccessToken();


     const response = await axios({
       url: process.env.PAYPAL_API + "/v2/checkout/orders",
       method: "post",
       headers: {
         "Content-Type": "application/json",
         Authorization: "Bearer " + accessToken,
       },
       data: JSON.stringify({
         intent: "CAPTURE",
         purchase_units: [
           {
             items: [
               {
                 name: "Node.js Complete Course",
                 description: "Node.js Complete Cours",
                 quantity: 1,
                 unit_amount: {
                   currency_code: "EUR",
                   value: "12.00",
                 },
               },
             ],
             amount: {
               currency_code: "EUR",
               value: "12.00",
               breakdown: {
                 item_total: {
                   currency_code: "EUR",
                   value: "12.00",
                 },
               },
             },
           },
         ],
         application_context: {
           cancel_url: "http://localhost:3001/api/paypalcancel", // redirect on cancel
           return_url: "http://localhost:3001/api/paypalsuccess", // redirect after approval
           shipping_preference: "NO_SHIPPING",
           user_action: "PAY_NOW",
           brand_name: "manfra.io",
         },
       }),
     });


     const final = response.data.links.find((link) => link.rel === "approve").href;


     return res.status(200).json({ message: "order is success", data: response.data.links });
   } catch (error) {
     console.log(error);
     return res.status(400).json({ message: error.message });
   }
 },

webhook :- set webhook in paypal sandbox account
webhook: async (req, res) => {
   try {
     const event = req.body;
     let capturePayment;


     if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
       const orderId = event?.resource?.id;
       const url = `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`;


       // Generate access token
       const tokenResponse = await axios({
         url: `${process.env.PAYPAL_API}/v1/oauth2/token`,
         method: "post",
         data: "grant_type=client_credentials",
         auth: {
           username: process.env.CLIENT_ID,
           password: process.env.CLIENT_SECRET,
         },
         headers: {
           "Content-Type": "application/x-www-form-urlencoded",
         },
       });


       const accessToken = tokenResponse.data.access_token;


       // Manually capture payment
       const captureResponse = await axios.post(
         url,
         {
           body: {
             phoneNo: 9898989898,
             orderId: "degfrg8vbnu81gb811thb15",
             paymentId: "brgbvvfb48jty",
             amount: 1,
           },
         },
         {
           headers: {
             "Content-Type": "application/json",
             Authorization: `Bearer ${accessToken}`,
           },
         }
       );


       capturePayment = captureResponse.data;
     } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
       console.log(event.event_type, "------------------------------------------ PAYMENT.CAPTURE.COMPLETED");


       const obj = {
         orderId: event.id,
         phoneNo: "igeg8gege9e8",
         paymentId: event.id,
         amount: 10,
       };
       await PaymenModel.create(obj);
     } else {
       console.log("unknown event -----------------------------");
     }


     res.status(200).send("OK");
   } catch (error) {
     console.error(error.response?.data || error.message || error);
     res.status(500).send("Something went wrong");
   }
 },

for better understand you can see image of sdk & rest api
