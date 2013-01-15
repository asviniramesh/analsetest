//views/fields/header.js
App.Views.Header = Backbone.View.extend({
			events : {
				"click #create-record-button" : "newRecord",
				"click #switch-app-link" : "showAppList",
				"click #search-button" : "search",
				"keypress #search-field" : "keyPressOnSearch"
			},
			initialize : function () {
				_.bindAll(this, "render", "newRecord", "showAppList", "showSpinner", "hideSpinner");
				this.render();
				this.bind("show_spinner", this.showSpinner);
				this.bind("hide_spinner", this.hideSpinner)
			},
			newRecord : function () {
				$(".tipsy").remove();
				console.log( 'App.Views.Header 	newRecord');
/*
				mpq.track("new record", {
						mp_note : "Create new button clicked.",
						app : App.currentApp.name,
						klass : App.currentKlass.get("name")
					});
*/
					window.location.hash = "#create"
			},
			keyPressOnSearch : function (a) {
				if (a.keyCode == 13) {
					this.search()
				}
			},
			search : function () {
				var search_key_value = $("#search-field").val();
				console.log ( 'App.Views.Header search searchqry: ' + search_key_value );
/*
				mpq.track("search", {
						mp_note : "Searched for " + a + ".",
						app : App.currentApp.name,
						query : a
					});
*/
					window.location.hash = "#search/" + search_key_value
			},
			showSpinner : function () {
				$("#spinner").show()
			},
			hideSpinner : function () {
				$("#spinner").hide()
			},
			showAppList : function () {
				var a = this;
				clearTimeout(this.timeout);
				if (this.list.is(":visible")) {
					this.list.fadeOut("fast")
				} else {
					this.list.fadeIn("fast");
					this.timeout = setTimeout(function () {
								a.list.fadeOut("fast")
							}, 3000)
				}
			},
			render : function () {
			   console.log( 'App.Views.Header render');
			   console.log (  'App.Views.Header App id' + App.user.currentAppId );
				var a = this;
				$(this.el).html(JST.header({
							app_name : App.apps[App.user.currentAppId].name
						}));
				this.list = this.$("#header-app-list");
				_(App.apps).each(function (c) {
				console.log('_(App.apps).each(function (c) {  loop ' );
						var b = new SwitchAppRowView({
									model : c
								});
						a.list.append(b.el)
					});
				a.list.append("<li><div class='switch-app-row'><a href='apps/new'>App Store</a></div></li>");
				this.$("#search-field").typeWatch({
						callback : (function () {
								a.search()
							})
					})
			}
		});
var SwitchAppRowView = Backbone.View.extend({
			tagName : "li",
			className : "switch-app-row",
			events : {
				click : "openApp"
			},
			initialize : function (a) {
				_.bindAll(this, "render", "openApp");
				this.render()
			},
			openApp : function () {
				$("#header-app-list").fadeOut("fast");
				$("#switch-app-link").html("&nbsp; " + this.model.name + " &nbsp; !");
				App.switchToApp(this.model)
			},
			render : function () {
				$(this.el).html(this.model.name)
			}
		});
