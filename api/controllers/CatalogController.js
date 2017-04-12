/**
Created by Sanjay Khurana (2016-11-05)
======================================
Catalog Listing Functionality
=============================
*/

var BaseController = require('./BaseController');

var CatalogController = BaseController.extend({

	'createProduct' : function(req, res) {
		if (req.method == 'POST') {
			ProductCollection.find({}).sort('createdAt DESC').limit(1).exec(function(err, respProd){
				var idProduct = !_.isEmpty(respProd) && !_.isEmpty(respProd[0]) ? parseInt(respProd[0].idProduct, 10) + 1 : 1; 
				var productData = {
				 "idProduct": idProduct,
				  "name": req.body.prdoductname,
				  "fkCategoryId": req.body.categoryId,
				  "price": req.body.productprice,
				  "specialPrice": req.body.productspprice,
				  "unit":  {},
				  "isActive" : req.body.isActive ? true : false,
				  "imagePath": req.body.productimage
				}
				if (!_.isEmpty(req.body.productvariant) && !_.isEmpty(req.body.productvariantprice)) {
					var prdVariant = req.body.productvariant.split(',');
					var prdPrice = req.body.productvariantprice.split(',');
					_.forEach(prdVariant, function(value, key){
						productData.unit[value] = {};
						productData.unit[value].price = prdPrice[key];
						productData.unit[value].specialPrice = 0;
					});
				}
				
			ProductCollection.create(productData).exec(function(error, response){
				if (error) {
					BaseController.logInfo("paalak.log", {"ErrorLog" : error});
					return res.view('500.ejs');
				} else {
					if (!_.isEmpty(response)) {
						return res.view('catalog/success.ejs');
					}
				}
			});
		});	
		} else {
			CategoryCollection.find().exec(function(error, categories){
				if (error) {
					BaseController.logInfo("paalak.log", {"ErrorLog" : err});
					return res.view('500.ejs');
				} else {
					if (!_.isEmpty(categories)) {
						var data = {};
						data.categories = categories;
						return res.view('catalog/createProduct.ejs', {"data" : data});			
					}
				}

			});
			
		}
		
	},
	'updateProduct' : function(req, res) {

		if (req.method == 'POST') {

			var productData = {
			  "idProduct": req.body.prdoductid,
			  "name": req.body.prdoductname,
			  "fkCategoryId": req.body.categoryId,
			  "price": req.body.productprice,
			  "specialPrice": req.body.productspprice,
			  "unit":  {},
			  "isActive" : req.body.isActive ? true : false,
			  "imagePath": req.body.productimage
			}
			if (!_.isEmpty(req.body.productvariant) && !_.isEmpty(req.body.productvariantprice)) {
				var prdVariant = req.body.productvariant.split(',');
				var prdPrice = req.body.productvariantprice.split(',');
				_.forEach(prdVariant, function(value, key){
					productData.unit[value] = {};
					productData.unit[value].price = prdPrice[key];
					productData.unit[value].specialPrice = 0;
				});
			}
			
		ProductCollection.update({'idProduct' : productData.idProduct}, productData).exec(function(error, response){
			if (error) {
				BaseController.logInfo("paalak.log", {"ErrorLog" : err});
				return res.view('500.ejs');
			} else {
				if (!_.isEmpty(response)) {
					return res.view('catalog/success.ejs');
				}
			}
		});	
		} else {
			CategoryCollection.find().exec(function(error, categories){
				if (error) {
					BaseController.logInfo("paalak.log", {"ErrorLog" : err});
					return res.view('500.ejs');
				} else {
					ProductCollection.find({'idProduct' : req.param('id')}).exec(function (err, product) {
						if (!_.isEmpty(product[0])) {
							var data = {};
							data.categories = categories;
							data.product = product[0];
							var productvariant=[];var prdVariantPrice=[];
							_.forEach(data.product.unit, function(value, key){
								productvariant.push(key);
								prdVariantPrice.push(value['price']); 
							});
							data.prdVariant = productvariant.join(',');
							data.prdVariantPrice = prdVariantPrice.join(',');
							return res.view('catalog/updateProduct.ejs', {"data" : data});			
						} else {
							BaseController.logInfo("paalak.log", {"ErrorLog" : 'No Product Exist'});
							var data = {};
							return res.view('catalog/updateProduct.ejs', {"data" : data});	
						}
					});
				}
			});
			
		}
		
	},
	'updateProductList' : function(req, res) {
		ProductCollection.find().exec(function (err, products) {
			if (err) {
				BaseController.logInfo("paalak.log", {"ErrorLog" : err});
				return res.view('500.ejs');
			} else {
				if (!_.isEmpty(products)) {
					CategoryCollection.find().exec(function(error, categories){
						var categoryJson = [];
						if (!_.isEmpty(categories)) {
							_.forEach(categories, function(category, key){
								categoryJson[category.idCategory] = category.name;
							})
						}
						if (!_.isEmpty(categoryJson)) {
							_.forEach(products, function(value, key){
								products[key]['categoryName'] = categoryJson[value.fkCategoryId];	
							})	
						}
					//	res.cookie('userCookie', req.userCookie);
						res.cookie('userCookie', req.userCookie,{ maxAge: 14400000000 });
						return res.view('catalog/updateProductList.ejs', {"products": products, "categories" : categoryJson, "req" : req});
					});
				}
			}
		});
	},

	'index' : function(req, res) {

		ProductCollection.find({'isActive' : true}).exec(function (err, products) {
			if (err) {console.log("Inside Error");
				BaseController.logInfo("paalak.log", {"ErrorLog" : err, "date" : new Date()});
				return res.view('500.ejs');
			} else {
				if (!_.isEmpty(products)) {
					CategoryCollection.find().exec(function(error, categories){
						var categoryJson = [];
						if (!_.isEmpty(categories)) {
							_.forEach(categories, function(category, key){
								categoryJson[category.idCategory] = {};
								categoryJson[category.idCategory]['name'] = category.name;
								categoryJson[category.idCategory]['dataName'] = category.name.toLowerCase().replace('&','').replace(/\s+/g, '-');
							})
						}
						if (!_.isEmpty(categoryJson)) {
							_.forEach(products, function(value, key){
								products[key]['categoryName'] = categoryJson[value.fkCategoryId];	
							})	
						}
					//	res.cookie('userCookie', req.userCookie);
						res.cookie('userCookie', req.userCookie,{ maxAge: 14400000000 });
						return res.view('catalog/index.ejs', {"products": products, "categories" : categoryJson, "req" : req});
					});
				} else { console.log("Inside final Error");
					BaseController.logInfo("paalak.log", {"ErrorLog" : err, "date" : new Date()});
					return res.view('500.ejs');
				}
			}
		});
	}

});

module.exports = CatalogController;
