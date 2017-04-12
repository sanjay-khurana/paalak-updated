/**
	Autologin with Session Id
**/


module.exports = function(req, res, next) {

	var shouldNotConsider = req.path.match(sails.config.staticsRegex);

    if (shouldNotConsider && shouldNotConsider.length) {
        return next();
    }


	if (!_.isEmpty(req.userCookie)) {
		req.user = {};
		UserCollection.find({'idSession' : req.userCookie}).exec(function(err, response){ //console.log(req.url);
			if (!_.isEmpty(response) && !_.isEmpty(response[0].contact)) {
				req.isLoggedIn = true;
				
				req.user.name = response[0].name;
				req.user.contact = response[0].contact;
				req.user.email = response[0].email;
				req.user.address = !_.isEmpty(response[0].address) ? response[0].address : {};
				if (!_.isEmpty(req.user.address)) {
					req.user.address = JSON.parse(req.user.address);
					req.user.displayAddress = req.user.address.address1 + ', ' + req.user.address.address2 + 
											', ' + req.user.address.city + ', ' + req.user.address.state +', ' 
											+ req.user.address.pincode;
					
					req.user.address1 = req.user.address.address1;
					req.user.address2 = req.user.address.address2;
					req.user.city = req.user.address.city;
					req.user.state = req.user.address.state;							
				}
				req.user.pincode = response[0].pincode;
				req.user.cart = JSON.stringify(response[0].cart);
				return next();	
			} else {
				req.isLoggedIn = false;
				return next();
			}
		});
	}

}