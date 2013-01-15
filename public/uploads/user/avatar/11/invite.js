//views/fields/invites.js
App.Views.Invites = Backbone.View.extend({
			events : {
				"keypress #invite-name" : "keypressOnInvite",
			},
			initialize : function () {
				_.bindAll(this, "initialize", "render", "unload", "addInvite");
				var a = this;
				$(document).bind("reveal.facebox", function () {
						$("#invite-add-button").unbind();
						$("#invite-name").keypress(function (b) {
								if (b.which == "13") {
									a.addInvite()
								}
							});
						$("#invite-add-button").click(function () {
								a.addInvite()
							})
					});
				this.render()
			},
			addInvite : function () {
				var a = this;
				$("#invite-alert").html("Adding...");
				$("#invite-alert").fadeIn("slow");
				$.post("subscriptions", {
						app_id : App.currentApp.id,
						email : $("#invite-name").val()
					}, function (b) {
						if (b.success) {
							$("#invite-name").val("");
							$("#invite-alert").html("Invite sent");
							$("#invite-alert").fadeIn("slow", function () {
									$("#invite-alert").fadeOut(2000)
								});
							a.renderUsers()
						} else {
							$("#invite-alert").html("Error sending that invite");
							$("#invite-alert").fadeIn("slow", function () {
									$("#invite-alert").fadeOut(2000)
								})
						}
					})
			},
			render : function () {
				var a = this;
				var b = JST.invite();
				$.facebox(b);
				a.renderUsers()
			},
			renderUsers : function () {
				var a = this;
				$("#users-list").html("");
				App.users = new App.Collections.Subscribers;
				App.users.fetch({
						success : function (c, b) {
							_.each(c.models, function (d) {
									$("#users-list").append(JST.subscriber({
												subscriber : d
											}))
								});
							$(".subscriber-action").bind("click", function (d) {
									$.ajax({
											url : "/subscriptions/" + d.target.id.split("-")[1] + "?app_id=" + App.currentApp.id,
											type : "DELETE",
											success : function () {
												a.renderUsers()
											}
										})
								})
						}
					})
			},
			keypressOnInvite : function () {
				if (event.keyCode == 13) {
					this.addInvite()
				}
			},
			unload : function () {
				$(this.el).detach()
			}
		});
App.Views.NotificationManager = Backbone.View.extend({
			tagName : "div",
			className : "notification-manager",
			initialize : function (b) {
				_.bindAll(this, "render", "buildList", "buildLists");
				var a = this;
				this.buildLists()
			},
			buildLists : function () {
				this.buildList("unread");
				this.buildList("read");
				this.options.appbox.setCount(this.unread.length);
				this.render()
			},
			buildList : function (a) {
				var b = this.options.appId ? App.notifications.channels[this.options.appId] : App.notifications.user;
				this[a] = new App.Collections.Notifications(b.select(function (c) {
								return a === "read" ? c.get("read") : !c.get("read")
							}));
				this[a + "List"] = new App.Views.NotificationList({
							collection : this[a],
							manager : this
						});
				this[a].bind("change", this.buildLists, this)
			},
			render : function () {
				var a = $(this.el);
				a.empty();
				a.append('<div class="notification-tools"><a class="mark" href="#">Mark all as read</a></div>');
				a.find("a.mark").click(function () {
						a.find("ul.notifications:visible li").click()
					});
				a.append(this.unreadList.el)
			}
		});
App.Views.NotificationList = Backbone.View.extend({
			tagName : "ul",
			className : "notifications",
			initialize : function () {
				_.bindAll(this, "render");
				this.notifications = this.collection;
				this.manager = this.options.manager;
				this.render()
			},
			markRead : function (a) {
				a.set("read", true)
			},
			markUnread : function (a) {
				a.set("read", false)
			},
			render : function () {
				var a = this;
				$(this.el).empty();
				if (this.notifications.length) {
					this.notifications.each(function (b) {
							var c = new App.Views.Notification({
										model : b,
										manager : a.manager
									});
							$(a.el).append(c.el)
						})
				} else {
					$(a.el).append('<li class="notification">No notifications yet.</li>')
				}
			}
		});
App.Views.Notification = Backbone.View.extend({
			tagName : "li",
			className : "notification",
			initialize : function () {
				_.bindAll(this, "render");
				this.manager = this.options.manager;
				this.render()
			},
			render : function () {
				var a = this,
				c = this.model,
				e = c.get("_id"),
				d = c.get("content"),
				b = (typeof d === "string");
				$(this.el).html(b ? d : d.text);
				$(this.el).click(function () {
						if (!b) {
							window.location.hash = d.url
						}
						$.ajax({
								url : "http://" + App.NODE_HOST + ":" + App.NODE_PORT + "/notification/" + e + "/markread",
								type : "POST",
								data : {
									user_id : App.user.id
								},
								complete : function () {
									var f = c.attributes;
									f.read = !f.read;
									c.set(f);
									c.trigger("change")
								}
							})
					})
			}
		});
App.Views.Options = Backbone.View.extend({
			initialize : function () {
				_.bindAll(this, "initialize", "render", "unload");
				var a = this;
				this.fieldName = this.options.fieldName;
				this.values = this.options.values;
				$(document).bind("reveal.facebox", function () {
						$("#new-option").keypress(function (b) {
								if (b.which == "13") {
									a.addOption()
								}
							})
					});
				this.render()
			},
			addOption : function () {
				var a = $("#new-option").val();
				$("#new-option").val("");
				this.values.push(a);
				this.pushOptions()
			},
			pushOptions : function () {
				var a = this;
				$("#new-option").attr("disabled", "disabled");
				$.ajax({
						url : "/klasses/" + App.currentKlass.id + "/options",
						type : "POST",
						data : {
							field : a.options.name,
							values : a.values
						},
						success : function (b) {
							a.values = b.values;
							a.renderOptions();
							field = _.detect(App.currentKlass.get("fields"), function (c) {
										return c.name == a.options.name
									});
							filter = _.detect(App.filterView.filterViews, function (c) {
										return c.filter.filter_type == "SelectFilter" && c.filter.field.toLowerCase() == a.options.name
									});
							if (field) {
								field.values = a.values
							}
							if (filter) {
								filter.render()
							}
							if (App.showView && App.showView.views[a.options.name]) {
								App.showView.views[a.options.name].values = a.values;
								App.showView.views[a.options.name].render()
							}
							App.indexView.render();
							$("#new-option").attr("disabled", "")
						}
					})
			},
			render : function () {
				var a = this;
				var b = JST.options({
							name : this.options.name
						});
				$.facebox(b);
				a.renderOptions()
			},
			renderOptions : function () {
				var a = this;
				$("#options-list").empty();
				_.each(this.values, function (b) {
						$("#options-list").append(JST.option_row({
									value : b
								}))
					});
				$(".option-action").bind("click", function (b) {
						a.values.splice(a.values.indexOf(b.target.id.split(":")[1]), 1);
						a.pushOptions()
					})
			},
			unload : function () {
				$(this.el).detach()
			}
		});
