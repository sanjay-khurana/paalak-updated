/**
	Intercept all the false URLs
**/


module.exports = function(req, res, next) {
	
//	if (req.secure) {
//	     return res.redirect('http://' + req.headers.host + req.path);	
//	}
//	console.log(req.headers.host);
	var backendRequest = ['createProduct', 'updateProductList', 'updateProduct'];
	var isAllowed = 0;
	_.forEach(backendRequest, function(value){
		if (req.path.indexOf(value) > -1) {
			if (req.isLoggedIn && (req.user.contact == sails.config.adminContact1 || req.user.contact == sails.config.adminContact2)) {
				isAllowed = 1
				// Allowed logged in
			} else {
				isAllowed = 2;
			}
		} 
	});
	if (isAllowed == 0 || isAllowed == 1) {
		return next();
	} else {
		return res.redirect('/');
	}

}
