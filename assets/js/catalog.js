/**

JS file for catalog Page

Created By: Sanjay Khurana
*/


$(document).ready(function($){
	
	var cartJson = getCartJson();
	var loginFromOrder = false;
	$('.category_name').click(function(){
		var categoryId = $(this).attr('data-category-id');
		showActiveCategory(categoryId, true);
		$(this).addClass('active');
	});

	$('.add-qty').click(function(){
		addToBasket($(this).parents('.item-list'));
	});

	$('.sub-qty').click(function() {
		var productId = $(this).parents('.item-list').find('.item-name').data('product-id');
		var productVariant = $(this).parents('.item-list').find('.item-name').find('.item-weight :selected').text();
		removeFromBasket(productId, productVariant);
	});	

	$('.item-weight').change(function(){
		$(this).parents('.item-list').find('.actual-price').html($(this).val());
	});

	$('.order-now').click(function(){
		if ($(this).data('login-button')) {
			loginFromOrder = true;	
		} else {
			saveCart(true);
		}
	});

	$('#pincode').on('change', function(){
		if ($(this).val().length == 6) {
			getPincodeDetails($(this).val());
		}
	});

	if ($('#pincode').length && $('#pincode').val().length > 0) {
		getPincodeDetails($('#pincode').val());
	}

	$('#placeorder').click(function(){
		if ($('#simpl-checkout-radio').is(':checked')) {
			simplPlaceOrder();
		} else {
			placeOrder();	
		}
	});

	function simplPlaceOrder() {
		$.ajax({
			'method': 'GET',
			'url' : '/getCartValue/',
			'success' : function(response) {
				if (response.success) {
					var cartValue = response.cartValue * 100;
					window.Simpl && window.Simpl.setTransactionAmount(cartValue); 
					window.Simpl && window.Simpl.authorizeTransaction();
					window.Simpl && window.Simpl.on('success', function(response) {
					  	if (response.status = 'success') {
					  		placeOrder(response.transaction_token)
					  	} else {
					  		$('#generic-error').html("Something Went Wrong! Use some other payment method");
					  		$('#generic-error').removeClass('hidden');
					  		window.scrollTo(0, 0);
					  	}
					});
				}
			}
		})
			
	}

	$('#resend_otp').click(function(){
		if (($('#contact-no').val().length > 10 || $('#contact-no').val().length < 10)) {
			return false;
		}
		generateOtp();
	});
	

	$('#generate-otp').click(function(){
		$('.contact-no-error').addClass('hidden');
		if (($('#contact-no').val().length > 10 || $('#contact-no').val().length < 10)) {
			$('.contact-no-error').removeClass('hidden');
			return false;
		}
		generateOtp();
	});

	$('#verify-otp').click(function(){
		$('.otp-error').addClass('hidden');
		if (($('#otp-no').val().length > 4 || $('#otp-no').val().length < 4)) {
			$('.otp-error').removeClass('hidden');
			return false;
		}
		verifyOtp();
	});

	function bindRemoveCart() {
		$('.prd-rmv-cart').on('click', function(){
			var pid = $(this).parents('.onpage-cart-item').attr('data-prd-id');
			var pvid = $(this).parents('.onpage-cart-item').attr('data-prd-variant');
			removeFromCart(pid, pvid);
		});
	}

	function generateOtp() {
		$('#generate-otp').attr('disabled',true);
		$('#resend_otp').addClass('hidden');
		$.ajax({
			'url' : '/generateOtp/',
			'data' : {'contact' : $('#contact-no').val()},
			'method' : 'post',
			'success' : function(response) {
				$('#resend_otp').removeClass('hidden');
				$('#generate-otp').attr('disabled',false);
				$('.generateOtp').addClass('hidden');
				$('.verifyOtp').removeClass('hidden');
			}
		})
	}

	function verifyOtp() {
		var data = {"otp" : $('#otp-no').val(), 'contact' : $('#contact-no').val()};
		$('#verify-otp').attr('disabled',true);
		$('.otp-error').addClass('hidden');
		$.ajax({
			'url' : '/verifyOtp/',
			'data': data,
			'method' : 'post',
			'success' : function(response) {
				$('#verify-otp').attr('disabled',false);
				if (response.success) {
				    if (loginFromOrder) {
						saveCart(true);
					} else {
						window.location.reload();	
					}	
				} else {
					$('.otp-error').removeClass('hidden');
				}
			}
		})
		
	}
	function showActiveCategory(categoryId, clicked){
		var windowUrl = window.location.href.split('#');
		if (windowUrl[1] && !clicked) {
			categoryId = $('.nav-tabs').find('.' + windowUrl[1]).attr('data-category-id');
		}	
		$('.category_name').removeClass('active');
		$('.item-list').addClass('hidden');
		$('.category_' + categoryId).removeClass('hidden');
		$('.nav-tabs').find('.category_id_'+ categoryId).addClass('active');
	}

	function addToBasket(itemList) {
		var productJson = {
			"productId" : "",
			"price" : "",
			"specialPrice" : 0,
			"image" : "",
			"qty" : 0,
			"name" : "",
			"variant" : ""
		}
		productJson.productId = itemList.find('.item-name').data('product-id');
		productJson.name  = itemList.find('.item-name').data('product-name');
		productJson.price = itemList.find('.item-weight').val();
		productJson.qty =  1;
		productJson.variant = itemList.find('.item-weight :selected').text();
		productJson.image = itemList.find('.itemImage').attr('data-src-imageName');

		var cartJson = getCartJson();
		if (typeof cartJson === 'object' && cartJson.hasOwnProperty(productJson.productId + "-" + productJson.variant)) {
			cartJson[productJson.productId + "-" + productJson.variant]['qty'] = parseInt(cartJson[productJson.productId + "-" + productJson.variant]['qty']) + 1; 
		} else {
			cartJson[productJson.productId + "-" + productJson.variant] = productJson;	
		}
		
		localStorage.setItem('cartJson', JSON.stringify(cartJson));
		userState();
	}

	function removeFromBasket(productId, productVariant) {
		var userCart =  JSON.parse(localStorage.getItem('cartJson'));
		if (typeof userCart === 'object' && Object.keys(userCart).length && userCart.hasOwnProperty(productId + '-' + productVariant)) {
			if (userCart[productId + '-' + productVariant].qty == 1) {
				delete userCart[productId + '-' + productVariant];
				$('.product_' + productId).find('.product-cnt').val(0);
			} else {
				userCart[productId + '-' + productVariant].qty = parseInt(userCart[productId + '-' + productVariant].qty) - 1;
			}
		}
		localStorage.setItem('cartJson', JSON.stringify(userCart));
		userState();
	}

	function removeFromCart(productId, productVariant) {
		var userCart =  JSON.parse(localStorage.getItem('cartJson'));
		if (typeof userCart === 'object' && Object.keys(userCart).length && userCart.hasOwnProperty(productId + '-' + productVariant)) {
			delete userCart[productId + '-' + productVariant];
			$('.product_' + productId).find('.product-cnt').val(0);
		}
		localStorage.setItem('cartJson', JSON.stringify(userCart));
		userState();
	}		

	function refreshCart(){
		var localCartJson = getCartJson();
		var cartHtml = "";
		var newCartHtml = "";
		var total = 0;var shipping = 20;

		for (var key in localCartJson) {
			cartHtml = $('.cart-items-temp');
			cartHtml.find('.prd-name').html(localCartJson[key].name);
			cartHtml.find('.prd-qty').html(localCartJson[key].qty);
			cartHtml.find('.prd-price').html(localCartJson[key].price * localCartJson[key].qty);
			cartHtml.find('.prd-variant').html(localCartJson[key].variant);
			cartHtml.find('.onpage-cart-item').removeClass('hidden');
			cartHtml.find('.prd-img').attr('src', '/images/' + localCartJson[key].image);
			cartHtml.find('.onpage-cart-item').attr('data-prd-id', localCartJson[key].productId);
			cartHtml.find('.onpage-cart-item').attr('data-prd-variant', localCartJson[key].variant);
			total = total + parseInt(localCartJson[key].price * localCartJson[key].qty);
			newCartHtml += cartHtml.html();
			cartHtml = "";
		}
		
		if (parseInt(total, 10) > 199) {
			shipping = 0;
		}
		$('.actual-total').html(total);
		if (total == 0) {
			shipping = 0;
		}
		$('.shipping-charges').html(shipping);
		$('.actual-payable').html(total + shipping);
		if (newCartHtml === "") {
			newCartHtml = "Create your basket of fresh produce";
		}
		$('.cart-items').html(newCartHtml);
		bindRemoveCart();
		saveCart(false);
	}

	function userState() {
		var userCart =  getCartJson();
		
		var productId, productVariant, productHtml;var cartCount = 0;
		if (typeof userCart === 'object' && Object.keys(userCart).length) {
			$.each(userCart, function(key, value){
				productId = value.productId;
				productVariant = value.variant;
				productDropdown = $('.product_' + productId).find('.item-weight');
				productDropdown.val(value.price);
				$('.product_' + productId).find('.product-cnt').val(value.qty);
				cartCount = cartCount + value.qty;
			});
		}
		$('.dsk-count > span').html(cartCount);
		$('.mob-count').html(cartCount);
		refreshCart();
	}

	function saveCart(orderNow) {
		var userCart = getCartJson();
		var postData = {};
		if (typeof userCart === 'object'  && Object.keys(userCart).length) {
			var i=0;
			$.each(userCart, function(key, value){
				postData[i] = {};
				postData[i].productId = value.productId;
				postData[i].variant = value.variant;
				postData[i].qty = value.qty;
				postData[i].price = value.price;
				postData[i].specialPrice = value.specialPrice;
				postData[i].name = value.name;
				i++;
			});
		}
		
		if (Object.keys(postData).length) {
			$.ajax({
				url: '/saveUserCart/',
				data: postData,
				method: 'post',
				success: function(response){
					if (response.success == true) {
						if (orderNow) {
							window.location.href = "/orderAddress/";	
						} else {
							if (response.discount && response.discount > 0) {
								$('.discount-charges').html(response.discount);
								var actualPayable = parseInt($('.actual-payable').html(), 10);
								$('.actual-payable').html(actualPayable - response.discount);
							}
						}
					}
				}
			})
		}		
		
	}

	function getPincodeDetails(pincode) {
		$('.wrong-pincode-error').addClass('hidden');
		$('#placeorder').attr('disabled', false);
		var data = {"pincode" : pincode};
		$.ajax({
			'method' : 'get',
			'url': '/getPincodeDetails/',
			'data': data,
			success: function(response) {
				if (response.success == false) {
					$('.wrong-pincode-error').removeClass('hidden');
					$('#placeorder').attr('disabled','disabled');
				} else {
					$('#city').val(response.city);
					$('#state').val(response.state);
					disableDeliveryTimePincode(pincode, response.deliveryInfo);
				}
			}
		})
	}
	
	function disableDeliveryTimePincode(pincode, deliveryInfo) {
		var optHtml = '';
		var timeSlots = deliveryInfo['availableTimeSlots'];
		for (var i in timeSlots) {
			optHtml += '<option value="' + timeSlots[i] + '">';
			optHtml += timeSlots[i] + '</option>';
		}
		$('#delivery-time').html(optHtml);	
		
	}

	function showThankyouPage(deliveryTime, userAddress) {
		$('.address-screen').hide();
		$('#final-delivery-time').html(deliveryTime);
		var showAddress = createAddress(userAddress);
		$('#user-address').html(showAddress);
		$('.thankyou-screen').removeClass('hidden');
		localStorage.removeItem('cartJson');
	}

	function createAddress(userAddress) {
		var returnAddress = JSON.parse(userAddress);
		var showAddress = "";
		for (var i in returnAddress) {
			if (returnAddress[i].length > 1) {
				showAddress += returnAddress[i] + ',';
			}
		}
		return showAddress;
	}

	function placeOrder(transaction_token){
		$('.error').addClass('hidden');
		var frm = $('#place-order-form');
		$('#placeOrder').attr('disabled', 'disabled');
		if (typeof transaction_token != "undefined") {
			frm.append('<input type="text" class="hidden" name="transaction_token" value="'+transaction_token+'" />');	
		}
		
	   
        $.ajax({
            type: frm.attr('method'),
            url: frm.attr('action'),
            data: frm.serialize(),
            success: function (response) {
                if (response.success == false) {
                	if (response.errors.length) {
                		for (var key in response.errors) {
                			$('.' + response.errors[key]).removeClass('hidden');
                		}
                	}
                	$('#placeOrder').attr('disabled', false);
                } else {
                	if (response.deliveryTime) {
                		showThankyouPage(response.deliveryTime, response.userAddress);	
                	}
                }
            }
        });

	      
		
	}

	function getCartJson() {
		var cartJson  = JSON.parse(localStorage.getItem('cartJson')) != null ? JSON.parse(localStorage.getItem('cartJson')) : {};
		if (Object.keys(cartJson).length) {
			return cartJson;
		} else if ($('.cart-json').length > 1) {
			
				var userCartJson = JSON.parse($('.cart-json').html());var newCartJson = {};
				$.each(userCartJson, function(key, productJson){
					if (typeof newCartJson === 'object' && cartJson.hasOwnProperty(productJson.productId + "-" + productJson.variant)) {
						newCartJson[productJson.productId + "-" + productJson.variant]['qty'] = parseInt(newCartJson[productJson.productId + "-" + productJson.variant]['qty']) + 1; 
					} else {
						newCartJson[productJson.productId + "-" + productJson.variant] = productJson;	
					}
				});
				return newCartJson;
		} else {
			return cartJson;
		}
		
	}

	function simplIntegrate() {
		if ($('#address-page').length > 0 && window.Simpl && $('#simpl-checkout').length > 0) {
			$('#simpl-checkout').hide();
			var contactNo = $('#contact').val();
			var email = $('#email').val();
			if (contactNo) {
				window.Simpl && window.Simpl.setApprovalConfig({
				  phone_number: contactNo,
				  email : email
				});
				
				window.Simpl && window.Simpl.on('approval', function yep() {
				  $('#simpl-checkout').show();
				  $('#simpl-checkout-radio').attr('checked', 'checked');
				  window.Simpl &&$('#simpl-checkout-text').html(window.Simpl && window.Simpl.getDisplayText()).show();
				}, function nope() {
				  	$('#simpl-checkout').hide();
				});
		
			}
			
		}
	}

	function init() {
		showActiveCategory(5);
		userState();
		simplIntegrate();
	}

	init();
});
