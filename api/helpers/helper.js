/**
	Helper Functions 

	Created By :Sanjay Khurana
**/
var moment =require('moment');

var HelperFunction =  {

	getDeliveryTimeOptions : function(pincode) {

		var timeSlots = {9 : "09:00 AM - 10:00 AM", 10 : "10:00 AM - 11:00 AM", 11 : "11:00 AM - 12:00 PM", 
							12 : "12:00 AM - 01:00 PM", 13: "01:00 PM - 02:00 PM", 
							14 : "02:00 PM - 03:00 PM", 15 : "03:00 PM - 04:00 PM", 16 : "04:00 PM - 05:00 PM",
							17 : "05:00 PM - 06:00 PM", 18 : "06:00 PM - 07:00 PM",19 : "07:00 PM - 08:00 PM",20 : "08:00 PM - 09:00 PM"};
		
		 timeSlots = {
							9 : "09:00 AM - 11:00 AM",  
							11 : "11:00 AM - 01:00 PM", 
							13: "01:00 PM - 03:00 PM", 
							15 : "03:00 PM - 05:00 PM", 
							17 : "05:00 PM - 07:00 PM",
							19 : "07:00 PM - 09:00 PM"
						};
		var availableTimeSlots = [];var showTimeSlots = 5;
		var slotKey = [];
		var i = 0;var j=0;
		var today = new Date();
		var currHour = Math.floor(today.getUTCHours() + 5.5);
		var dateString = moment(today).format('MMMM Do  YYYY');
		var pincodeMapping = sails.config.pincodeCityStateMapping;
		if (!pincode) {
			pincode = '110025';
		}
		while (availableTimeSlots.length <= showTimeSlots) {
			_.forEach(timeSlots, function(value, key){
				if (availableTimeSlots.length <= showTimeSlots) {
					if (currHour + 3 > parseInt(key) + i) {
						//continue;
					} else if (_.indexOf(pincodeMapping[pincode].slots, key) != -1) { 
						availableTimeSlots.push(dateString + " " + value);
						slotKey.push(key);
					}
				}
			});
			 i = i + 24;
			 j = parseInt(i/24, 10);
			 dateString = moment(today).add(j, 'days').format('MMMM Do  YYYY');
			 
		}
		//return availableTimeSlots;
		return {
	         availableTimeSlots: availableTimeSlots,
	         slotKey: slotKey
	     };
	},

	getOrderNumber : function() {
		return moment().format("YYMMDDHHmmss");
	},

	getCartValue : function(cartData) {
		var cartValue = 0;
		if (!_.isEmpty(cartData)) {
			_.forEach(cartData, function(value, key){
				if (value.specialPrice > 0) {
					cartValue += parseInt(value.specialPrice, 10) * parseInt(value.qty);;
				} else {
					cartValue += parseInt(value.price, 10) * parseInt(value.qty);
				}
			})
		}
		return cartValue;
	},
	getOrderDetailHtml : function(cartData) {
		var cartString = "";
		_.forEach(cartData, function(value, key){
			cartString += "<br>";
			cartString += value.qty + 'X ';
			cartString += value.name + " ";
			cartString += value.variant + " ";
			cartString += "Rs. " + value.price + ' each';
			cartString += "</>";
		});
		return cartString;
		//return String(cartString).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
		//return ;
	},
	
	getOrderListingHtml : function(cartData) {
		var cartString = "";
		_.forEach(cartData, function(value, key){
			cartString += "<br>";
			cartString += value.qty + 'X ';
			cartString += value.name + " ";
			cartString += value.variant + " ";
			cartString += "Rs. " + value.price + ' each';
			cartString += "</>";
		});
		return cartString;
	},
	placeSimplOrder : function(orderData, userData, cb) {
		var orderResponse = {
			'success' : true
		}
		var items = [];
		var productObj = {
			    "sku": "",
			    "quantity": 0,
			    "unit_price_in_paise": 0,
			    "display_name": ""
		 }
		_.forEach(orderData.cart ,function(value){
			productObj["sku"] = 'PAALAK' + value.productId;
			productObj["quantity"] = value.qty;
			productObj["unit_price_in_paise"] = value.price;
			productObj["display_name"] = value.name;
			items.push(productObj);
		});
		
		if (orderData.paymentMethod == 'SimplCheckout') {
			var simplApiRequestData = {
				  "transaction_token": orderData.transaction_token,
				  "amount_in_paise": orderData.orderValue * 100,
				  "order_id": orderData.orderId,
				  "items": items,
				  "shipping_address": userData.address,
				  "billing_address": userData.address,
				  "shipping_amount_in_paise": orderData.shippingCharges,
				  "discount_in_paise": orderData.cartDiscount,
			}
			var simplApiRequest = {
				url : sails.config.simplTransUrl + '/api/v1.1/transactions',
				body : JSON.stringify(simplApiRequestData),
				method : 'POST',
				headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'a77bafdc05a5fc2236c10b89c7b513e4'
                 }
			}
			
			ExternalApi.request(simplApiRequest).then(function(response, err){
				var responseBody = JSON.parse(response[0].body);
				if (!_.isEmpty(responseBody) && responseBody.success == true) {
					cb (orderResponse);
				} else {
					orderResponse.success = false;
					cb (orderResponse);
				}
			});
		} else {
				cb (orderResponse);
			}
		}
}

module.exports = HelperFunction;
