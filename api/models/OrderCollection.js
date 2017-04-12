/**
 * OrderCollection.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
	    "idSession": {'type':'string'},
	    "orderId" : {'type' : 'string'},
	    "contact" : {'type' : 'string'},
	    "email" : {'type' : "string"},
	    "name": {'type' : 'string'},
	    "pincode" : {'type' : 'int'},
	    "deliveryTime" : {'type' : 'string'},
	    "cart": {'type':'json'},
	    "addresss1" : {'type' : 'string'},
	    "addresss2" : {'type' : 'string'},
	    "paymentMethod" : {'type' : 'string'},
	    "orderValue" : {'type' : 'int'},
	    "city": {'type':"string"},
	    "state": {'type':"string"},
	    "status": {'type' : 'string', enum : ['placed', 'shipped', 'delivered'], defaultsTo: 'cm'}
	}
};
