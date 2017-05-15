/**
Created by Sanjay Khurana (2016-11-26)
======================================
Order Functionality
=============================
*/


var BaseController = require('./BaseController');
var ExternalAPI = require('./../services/ExternalApi');
var HelperFunction = require('./../helpers/helper');

var OrderController = BaseController.extend({ 

	'cartSave' : function(req, res) {
		if (!_.isEmpty(req.body)) {
			var cartData = req.body;
			var userData = {
				'idSession' : req.userCookie,
				'name' : 'Guest',
				'contact' : "",
				'email' : "",
				'cart' : cartData,
				'address' : JSON.stringify({}),
				'cartValue' : HelperFunction.getCartValue(cartData),
				'cartDiscount' : 0
			}
			
			if (!_.isEmpty(req.user)) {
				userData.name = req.user.name;
				userData.contact = req.user.contact;
				userData.email = req.user.email;
				if (!_.isEmpty(req.user.address)) {
					userData.address = JSON.stringify(req.user.address);	
				}
			}
			
			// 10% off for existing user
			userData.cartDiscount = 0;
			if (!_.isEmpty(userData.email)) {
				userData.cartDiscount = parseInt(userData.cartValue * (10/100), 10);
			}

			
			
			UserCollection.find({'idSession' : userData.idSession}).exec(function(err, response){
				if (err) {
					BaseController.logInfo("paalak.log", {"ErrorLog" : err, "error" :  "Session Id not found","date" : new Date()});
					return res.json({
						'success' : false,
						"error" :  "Session Id not found"

					});
				} else {
					if (!_.isEmpty(response)) {
						UserCollection.update({'idSession' : userData.idSession}, userData).exec(function(err, updateRes){
							if (err) {
								BaseController.logInfo("paalak.log", {"ErrorLog" : err, 'error':"Update failed", "date" : new Date()});
								return res.json({
									'success' : false,
									'error':"Update failed"
								});
							}
							return res.json({'success' : true, 'discount' : userData.cartDiscount});
						});
					} else {
						UserCollection.create(userData).exec(function(err, createRes){
							if (err) {
								BaseController.logInfo("paalak.log", {"ErrorLog" : err, "error": 'New use create failed', "date" : new Date()});
								return res.json({
									'success' : false,
									"error": 'New use create failed'
								});
							}
							return res.json({'success' : true, 'discount' : userData.cartDiscount});
						});
					}
				}
			});
			
		} else {

		}
	},
	'orderAddress' : function(req, res) {
		var data = {};
		data.errors = {};
		//data.availableSlots = HelperFunction.getDeliveryTimeOptions();
		var deliveryInformation = HelperFunction.getDeliveryTimeOptions();
		data.availableSlots = deliveryInformation.availableTimeSlots;
		data.slotKeys = deliveryInformation.slotKey;
		return res.view('order/address.ejs', {"data" : data});
	},
	
	'getPincodeDetails' : function(req, res) {
		var pincode = req.query.pincode;
		var pincodeAvailaility = _.filter(sails.config.deliverablePincodes, function(pc){
			return pc == pincode;
		});

		var deliveryInformation = HelperFunction.getDeliveryTimeOptions(pincode);
		OrderCollection.find().where({"deliveryTime" : deliveryInformation.availableTimeSlots}).exec(function(err, orders){
			if (!_.isEmpty(orders)) {
				var orderByDeliveryTime = {};
				_.forEach(orders, function(value, key){
					if (typeof orderByDeliveryTime[value.deliveryTime] === "undefined") {
						orderByDeliveryTime[value.deliveryTime] = 1;	
					} else {
						orderByDeliveryTime[value.deliveryTime] += 1;
					}
				});
			}
			var removeDeliverySlot = [];	
			_.forEach(deliveryInformation.availableTimeSlots, function(value){
				if (!_.isEmpty(orderByDeliveryTime) &&  orderByDeliveryTime[value] >= sails.config.maxOrderPerPincode) {
					removeDeliverySlot.push(value);
				}
			});
			deliveryInformation.availableTimeSlots = _.difference(deliveryInformation.availableTimeSlots, removeDeliverySlot);
			if (!_.isEmpty(pincode)) {
				if (!_.isEmpty(pincodeAvailaility)) {
					return res.json({
						'success': true,
						'city': sails.config.pincodeCityStateMapping[pincode].city,
						'state': sails.config.pincodeCityStateMapping[pincode].state,
						'deliveryInfo' : deliveryInformation
					});
				}
			} else {
				BaseController.logInfo("paalak.log", {"InfoLog" : pincode + " Check for availabilty"});
				return res.json({
					'success' : false,
				});
			}
		});
		
	},
	'placeOrder' : function(req, res) {
		if (!_.isEmpty(req.body)) {
			var addressData = req.body;
			var orderData = {};
			var shippingCharges = 0;

			orderData.orderId = 'PAALAK' + HelperFunction.getOrderNumber();
			orderData.idSession = req.userCookie;
			orderData.contact = addressData.contact;
			orderData.email = addressData.email;
			orderData.name = addressData.name;
			orderData.pincode = addressData.pincode;
			orderData.address1 = addressData.address1;
			orderData.address2 = addressData.address2;
			orderData.city = addressData.city;
			orderData.state = addressData.state;
			orderData.deliveryTime = addressData.deliveryTime;
			orderData.paymentMethod = addressData.paymentMethod;
			orderData.status = "placed";
			orderData.orderValue = 0;
			if (addressData.transaction_token != "undefined") {
				orderData.transaction_token = addressData.transaction_token;
			}


			//Creating data for User Update
			var userData = {};
			userData.pincode = orderData.pincode;
			userData.contact = addressData.contact;
			userData.name = addressData.name;
			userData.email = addressData.email;
			userData.isMarketing = addressData.acceptance ? 1 : 0;
			
			userData.address = JSON.stringify({
				'address1' : orderData.address1,
				'address2' : orderData.address2,
				'pincode'  : orderData.pincode,
				'city'	: orderData.city,
				'state' : orderData.state
			});

			// Checkinn validity of Order Data
			var errors = [];
			if (orderData.contact.length < 10 || orderData.contact.length > 10) {
				errors.push('contact-error');
			}
			
			if (orderData.pincode.length < 6 || orderData.pincode.length > 6) {
				errors.push('pincode-error');
			}

			if (!orderData.name.length) {
				errors.push('fullname-error');
			}
			if (!orderData.address1.length) {
				errors.push('address1-error');	
			}
			if (!orderData.city.length) {
				errors.push('city-error');
			}
			if (!orderData.state.length) {
				errors.push('state-error');
			}

			if (!orderData.paymentMethod) {
				errors.push('paymentmethod-error');
			}

			if (!orderData.email.length) {
				errors.push('email-error');
			}

			if (errors.length) {
				BaseController.logInfo("paalak.log", {"Error Log" : errors});
				return res.json({
						'success' : false,
						'errors' : errors
				});
			}

			var apiRequestUrl = sails.config.orderSmsConfig.url;
			var apiRequestData = {
				"listId":sails.config.orderSmsConfig.listId,
				"userId":sails.config.orderSmsConfig.userId,
				"subscribers":{
					"headers":["ID","Name", "Mobileno","ordconfdate","OrderValue"],
					"data":{
						"sequence":{
							"1":{
								"ID":3,"Name": orderData.name,"Mobileno":orderData.contact,"ordconfdate": orderData.deliveryTime,"OrderValue": 0
							}
						}
					}
				}
			}

			var emailRequestUrl = sails.config.orderEmailConfig.url;
			var emailApiRequestData = {
				"listId":sails.config.orderEmailConfig.listId,
				"userId":sails.config.orderEmailConfig.userId,
				"subscribers":{
					"headers":["OrderID","name","email","mobile","timeoforder","order_detail","OrderValue","Exp_DeliveryDate","address","Paymentmethod", "Shippingchrage"],
					"data":{
						"sequence":{
							"1":{
								"OrderID":orderData.orderId,
								"name": orderData.name,
								"email":orderData.email,
								"mobile": orderData.contact,
								"timeoforder": new Date(),
								"order_detail" : {},
								"OrderValue": 0,
								"Exp_DeliveryDate" : orderData.deliveryTime,
								"address":orderData.address1 + ', ' + orderData.address2 + ', ' + orderData.city + ', ' + orderData.state + ', ' + orderData.pincode,
								"Paymentmethod": orderData.paymentMethod,
								"Shippingchrage" : shippingCharges
							}
						}
					}
				}
			}
			

			var data = {};
			data.deliveryTime = orderData.deliveryTime;

			UserCollection.find({'idSession' : orderData.idSession}).exec(function(err, response){
				if (err) {
					BaseController.logInfo("paalak.log", {"Error Log" : "Session Id Not found in order"});
					return res.json({
						'success' : false,
						'errors' : err
					});
				} else {
					
					if (!_.isEmpty(response) && !_.isEmpty(response[0].cart)) {
						orderData.cart = response[0].cart;
						orderData.orderValue = response[0].cartValue;
						orderData.cartDiscount = response[0].cartDiscount;
						if (orderData.orderValue <= 199) {
							shippingCharges = 20;
							orderData.shippingCharges = 20;
							orderData.orderValue = parseInt(orderData.orderValue, 10) + parseInt(shippingCharges, 10);
						}
						orderData.orderValue = orderData.orderValue - parseInt(orderData.cartDiscount, 10);
						
						emailApiRequestData.subscribers.data.sequence["1"].order_detail = HelperFunction.getOrderDetailHtml(orderData.cart);
						emailApiRequestData.subscribers.data.sequence["1"].OrderValue = orderData.orderValue;
						emailApiRequestData.subscribers.data.sequence["1"].Shippingchrage = shippingCharges;
						apiRequestData.subscribers.data.sequence["1"].OrderValue = orderData.orderValue;
						
					HelperFunction.placeSimplOrder(orderData, userData, function(simpResponse){
						if (simpResponse.success == true) {
							OrderCollection.create(orderData).exec(function(err, resp){
									if (err) {
										
										BaseController.logInfo("paalak.log", {"Error Log" : "Order Creating Issue"});
										return res.json({
											'success' : false
										});
									} else {
										if (!_.isEmpty(resp)) {
											UserCollection.update({'idSession' : orderData.idSession}, {'name' : userData.name, 'contact': userData.contact, 'pincode' : userData.pincode, 'address' : userData.address, 'cart' : "", "email" : userData.email, "isMarketing" : userData.isMarketing}).exec(function(err, updateRes){
												if (err) {
													BaseController.logInfo("paalak.log", {"Error Log" : "User Update failed while placing order"});
												}
												var apiRequest = {
													url : apiRequestUrl,
													body : JSON.stringify(apiRequestData),
													method : 'POST',
													headers: {
									                    'Content-Type': 'application/json'
									                 }
												}
												ExternalApi.request(apiRequest).then(function(response){
													return res.json({
															'success' : true,
															'deliveryTime' : data.deliveryTime,
															'userAddress' : userData.address
													});
												});
												var emailApiRequest = {
													url : emailRequestUrl,
													body : JSON.stringify(emailApiRequestData),
													method : 'POST',
													headers: {
									                    'Content-Type': 'application/json'
									                 }
												}
												ExternalApi.request(emailApiRequest).then(function(response){
													
												});
												emailApiRequestData.subscribers.data.sequence["1"].email = sails.config.paalakEmail
												var emailCareApiRequest = {
													url : emailRequestUrl,
													body : JSON.stringify(emailApiRequestData),
													method : 'POST',
													headers: {
									                    'Content-Type': 'application/json'
									                 }
												}
												ExternalApi.request(emailCareApiRequest).then(function(response){
														
												});

											});
											
										}
									}
								})
							} else {
								BaseController.logInfo("paalak.log", {"Error Log" : "Simpl Checkout Error"});
								return res.json({
									'success' : false,
									'errors': {}
								});
							}
						});
					}
				}

				});
			
		}
		
	},
	
	'verifyOtp' : function(req, res) {
		
		if (!_.isEmpty(req.body) && !_.isEmpty(req.body.otp) && !_.isEmpty(req.body.contact)) {
			var contact = req.body.contact;
			if (req.body.otp != req.cookies.userOtp) {
				return res.json({"success" : false, "error" : "OTP does not match"});
			}
		UserCollection.find({
				'contact': contact
			}).exec(function(err, response) {
				if (err) {

				} else {
					
					if (!_.isEmpty(response)) {
						res.cookie('userCookie', response[0].idSession);
						return res.json({
							"success": true
						});
					} else {
						UserCollection.update({
							'idSession': req.userCookie
						}, {
							'contact': contact
						}).exec(function(err, updateRes) {
							if (err) {

							} else {
								if (!_.isEmpty(updateRes)) {
									return res.json({
										'success': true
									});
								} else {
									var userData = {
										'idSession': req.userCookie,
										'name': 'Guest',
										'contact': contact,
										'cart': "",
										'address': JSON.stringify({})
									}

									UserCollection.create(userData).exec(function(err, createRes) {
										if (err) {
											return res.json({
												'success': false,
												"error": 'New use create failed'
											});
										}
										return res.json({
											'success': true
										});
									});
								}
							}
						})
					}
				}
			});

		}

	},

	generateOtp : function(req, res) {
		if (!_.isEmpty(req.body) && !_.isEmpty(req.body.contact)) {
			var contact = req.body.contact;
			var otp = Math.floor(1000 + Math.random() * 9000);
			var apiRequestUrl = sails.config.otpApiConfig.url;
			var apiRequestData = {
				"listId":sails.config.otpApiConfig.listId,
				"userId":sails.config.otpApiConfig.userId,
				"subscribers":{
					"headers":["SR","Mobileno","otp"],
					"data":{
						"sequence":{
							"4":{
								"SR":3,"Mobileno":contact,"otp":otp
							}
						}
					}
				}
			}

			var apiRequest = {
				url : apiRequestUrl,
				body : JSON.stringify(apiRequestData),
				method : 'POST',
				headers: {
                    'Content-Type': 'application/json'
                 }
			}
			
			ExternalApi.request(apiRequest).then(function(err, response){
				res.cookie('userOtp', otp);
				if (err) {
					return res.json({"success" : true});
				}
				
				return res.json({"success" : true});	
			})
			
		}
	},

	logout : function(req, res) {
		if (!_.isEmpty(req.userCookie)) {
			res.clearCookie('userCookie');
			res.redirect('/');
		}
	},
	
	orderListing : function(req, res) {
		OrderCollection.find({}).exec(function(err, response){
			UserCollection.find({}).exec(function(err, userResponse){
				var orderData = [];
				if (!_.isEmpty(response)) {
					_.forEach(response, function(value, key){
						orderData[key] = {};
						orderData[key].name = value.name;
						orderData[key].orderId = value.orderId;
						orderData[key].contact = value.contact;
						orderData[key].email = value.email;
						orderData[key].orderValue = value.orderValue;
						orderData[key].cartString = HelperFunction.getOrderListingHtml(value.cart);
						orderData[key].deliveryTime = value.deliveryTime;
						orderData[key].status = value.status;
						if (!_.isEmpty(value.paymentMethod)) {
							orderData[key].paymentMethod = value.paymentMethod;	
						} else {
							orderData[key].paymentMethod = '';
						}
						orderData[key].address = '';
						_.forEach(userResponse, function(userval, userKey){
							if (userval.contact == value.contact) {
								var address = JSON.parse(userval.address);
								orderData[key].address = address.address1 + ', ' + address.address2 + ', ' + address.city + ', ' + address.state + ', ' + address.pincode;
							}
						});
					});
					orderData = orderData.reverse();
					return res.view('order/orderListing.ejs', {"orderData" :orderData});	
				} else {
					return res.json({
							'success' : false,
							"error":
							'Getting Order Data Failed'
					});
				}
			});
		});
	},

	getCartValue: function(req, res) {
		var userSessionId = req.userCookie;
		UserCollection.find({'idSession' : userSessionId}).exec(function(err, response){
			if (err) {
				BaseController.logInfo("paalak.log", {"Error Log" : "Session Id Not found in order"});
				return res.json({
					'success' : false
				});
			} else {
				if (!_.isEmpty(response) && !_.isEmpty(response[0].cart)) {
					var orderData = {};
					orderData.cart = response[0].cart;
					orderData.cartDiscount = response[0].cartDiscount;
					orderData.orderValue = response[0].cartValue;

					if (orderData.orderValue <= 199) {
						shippingCharges = 20;
						orderData.orderValue = parseInt(orderData.orderValue, 10) + parseInt(shippingCharges, 10);
					}
					orderData.orderValue = orderData.orderValue - parseInt(orderData.cartDiscount, 10);
					return res.json({
						'success' : true,
						'cartValue' : orderData.orderValue
					});
				}
			}
		});			
	}  

});

module.exports = OrderController;
