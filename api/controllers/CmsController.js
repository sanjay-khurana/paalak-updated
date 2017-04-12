

var BaseController = require('./BaseController');



var CmsController = BaseController.extend({

	refundPolicy : function (req, res) {
		return res.view('cms/policy.ejs');
	},
	aboutUs : function (req, res) {
		return res.view('cms/about-us.ejs');
	},
	'call'  : function (req, res) {
		return res.view('cms/call.ejs');
	},
	privacyPolicy : function (req, res) {
		return res.view('cms/privacy-policy.ejs');
	},
	whatsApp : function (req, res) {
		return res.view('cms/whatsapp.ejs');
	},
	bulkSupplies : function (req, res) {
		return res.view('cms/bulk-supplies.ejs');
	},
	contact : function (req, res) {
		return res.view('cms/contact.ejs');
	}

});


module.exports = CmsController;