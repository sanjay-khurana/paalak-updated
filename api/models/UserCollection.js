/**
 * UserCollection.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
	    "idSession": {'type':'string'},
	    "name": {'type' : 'string'},
	    "contact" : {'type' : "string"},
	    "email" : {'type' : "string"},
	    "pincode" : {'type' : "int"},
	    "cart": {'type':'json'},
	    "address" : {'type' : 'string'},
	    "cartValue" : {'type' : 'int'},
	    "isMarketing" : {'type' : 'int'}
	}
};