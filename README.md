youtube example with credit card paypal payment :- https://www.youtube.com/watch?v=iLBWtIEOeug

1)we can integrate in two ways
    using sdk ( npm library of paypal )
    using Rest apis of paypal ( using axios to call api )

2)account setup :-
  create main account
  click on developer 
  click on sandbox accounts
  add business account in sandbox mode
  create App in sandbox account
  create app as merchant
  now open that App and you can see webhook after several scroll
  you can add webhook endpoint in that App
  now account is setup successfully
    open link for more information ⇒ https://developer.paypal.com/studio/checkout/standard/integrate
    you can test here as online as all payment method


3)for one time payment
  two option ⇒
      OPTION 1(without webhook)
        1.generate Access token via secret key & client id
        2.create order ( use clientId & secretId of sand box )
          -set return url in createOrder paypal will call return url with orderId(token) in query
          -paypal automatic set orderId in return url query as token
        3.call capture payment api from frontend with passing that orderId(token)
          -in backend we capture payment against that orderId
          -if capturePayment api response has status=COMPLETED status so it payment capture frontend dev can show success page
          -or fail so frontend dev can show payment failed page 
        4.success without webhook set

      OPTION 2(with webhook)
        1.generate Access token via secret key & client id
        2.create order ( use clientId & secretId of sand box )
        3.capture payment in webhook after call ⇒ CHECKOUT.ORDER.APPROVED
        4.means u need to set call capture api in webhook in side if(event_type == CHECKOUT.ORDER.APPROVED)
        5.when that payment is webhook send PAYMENT.CAPTURE.COMPLETED event
          -we can update db table as payment is success from capture.completed webhook metadata
        6.also we need to give checkPaymentStatus api for frontend dev
          -after order is completed by user paypal redirect to return url that time
          -frontend devloper hold user to waiting page for payment confirmation
          -on waiting page frontend developer call checkPayment api every 4sec till status ⇒  paid or failed
          -when payment capture/cancelled event call so in that time we set in DB ⇒ paymentStatus=paid,paymentStatus=filed,paymentStatus=pending(default),
          -when in waiting page paymentStatus=paid frontend developer show payment success page to user

4)notes for paypal :- 
    payment lenar nu acc business sandbox acc and created app of paypal bnne as merchant hovu joyye
    paypal ma buyer and seller(merchant) bnne acc Indian hse to work krse nhi ( due to government rule)
    generally paypal charges 3.49% + 0.49 fixed ⇒
    check paypal fees ⇒ https://www.paypal.com/us/business/paypal-business-fees


5)for more check on paypal website ⇒
    integrat with sdk:- https://developer.paypal.com/studio/checkout/standard/integrate
    integrat with apis:- https://developer.paypal.com/docs/api/orders/v2/#orders_create
    also about webhook :- https://developer.paypal.com/api/rest/webhooks/simulator/
 
 