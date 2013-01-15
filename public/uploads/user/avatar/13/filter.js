//views/fields/filters.js
App.Views.Filters = Backbone.View.extend({
		initialize : function (a) {
			console.log('App.Views.Filters initialize');
			_(this).bindAll("render", "highlightSelected", "initFilterViews");
			this.filterViews = {};
			this.showFilters = {};
			this.render()
		},
		initFilterViews : function (c) {
			var b = this;
			var a = {};
			_(c).each(function (d) {
				switch (d.filter_type) {
				case App.FilterTypes.FILTER:
					a[d.id] = new FilterView({
							filter : d
						});
					break;
				case App.FilterTypes.USER:
					a[d.id] = new UserFilterView({
							filter : d
						});
					break;
				case App.FilterTypes.SELECT:
					a[d.id] = new SelectFilterView({
							filter : d
						});
					break;
				default:
					a[d.id] = new FilterView({
							filter : d
						});
					break
				}
			});
			return a
		},
		render : function () {
			console.log('App.Views.Filters render');
			var a = this;
			$(this.el).html("");
			//App.currentApp = klassdata ; //mahendran
			console.log(App.currentApp.klasses);
			_(App.currentApp.klasses).each(function (app_metadata, c) {
				
				console.log('App.currentApp.klasses.length :' + App.currentApp.klasses.length);
				console.log(app_metadata);
				if (App.currentApp.klasses.length != 1) {
					if (c != 0 && c != App.currentApp.klasses.length) {
						$(a.el).append("<div class='klass_border' />")
					}
					$(a.el).append("<div class='klass_heading'>" + app_metadata.name + "</div>")
				}
				if (app_metadata.show_all) {
					a.showFilters[app_metadata.id] = new FilterView({
							filter : {
								name : "Show All",
								id : "",
								klass_id : app_metadata.id
							}
						});
					$(a.el).append(a.showFilters[app_metadata.id].el)
				}
				_(a.initFilterViews(app_metadata.filters)).each(function (d) {
					//console.log(b.filters);
					console.log('_(a.initFilterViews(app_metadata.filters)).each(function (d) {');
					console.log('d.filter.id: ' + d.filter.id);
					a.filterViews[d.filter.id] = d;
					
					$(a.el).append(d.el)
				})
			})
		},
		highlightSelected : function (a, b) {
			if (!b) {
				this.$(".filter").removeClass("selected-filter");
				_(this.filterViews).each(function (c) {
					c.reset()
				})
			}
			if (a === false) {
				return
			}
			if (a == "" && this.showFilters[App.currentKlass.id]) {
				$(this.showFilters[App.currentKlass.id].el).addClass("selected-filter")
			} else {
				if (this.filterViews[a]) {
					$(this.filterViews[a].el).addClass("selected-filter")
				}
			}
		}
	});
FilterView = Backbone.View.extend({
		tagName : "div",
		className : "filter",
		events : {
			click : "show"
		},
		initialize : function () {
			_(this).bindAll("show", "reset", "render");
			this.filter = this.options.filter;
			this.render()
		},
		show : function () {
			console.log('FilterView  show filtername:' + this.filter.name + ' filter id: ' + this.filter.id);
			/*
			mpq.track("filter changed", {
			mp_note : "Changed filter to " + this.filter.name + ".",
			name : this.filter.name,
			filter_id : this.filter.id
			});
			 */
			App.showFilter(this.filter.id, this.filter.klass_id)
		},
		
		reset : function () {},
		render : function () {
			$(this.el).html(this.filter.name)
		}
	});
UserFilterView = Backbone.View.extend({
		tagName : "div",
		className : "filter",
		initialize : function () {
			_(this).bindAll("reset", "render");
			this.filter = this.options.filter;
			this.render()
		},
		reset : function () {
			if (window.location.hash.indexOf(this.filter.id) == -1) {
				this.$("option").eq(0).attr("selected", "selected")
			}
		},
		render : function () {
			var a = this;
			$(this.el).html(JST.user_field({
					name : this.filter.name,
					selected : ([]),
					users : App.users.models,
					allowNull : true
				}));
			this.$("select").bind("change", function () {
				var b = a.$("select").val();
				if (b == "") {
					App.showFilter(a.filter.id, App.currentKlass.id)
				} else {
					params = "?user_id=" + b;
					App.showFilter(a.filter.id + params, App.currentKlass.id)
				}
			})
		}
	});
SelectFilterView = Backbone.View.extend({
		tagName : "div",
		className : "filter",
		initialize : function () {
			_(this).bindAll("reset", "render");
			this.filter = this.options.filter;
			this.render()
		},
		reset : function () {
			if (window.location.hash.indexOf(this.filter.id) == -1) {
				this.$("option").eq(0).attr("selected", "selected")
			}
		},
		render : function () {
			var a = this;
			var b = null;
			b = _.detect(App.currentKlass.get("fields"), function (c) {
					return c.name == a.filter.field.toLowerCase()
				});
			if (!b) {
				throw("Cannot find klass_field for " + this.filter.field)
			}
			if (b.field_type == App.FieldTypes.OPTION_SELECT) {
				$(this.el).html(JST.option_select_field({
						name : this.filter.name,
						value : "",
						values : b.values
					}))
			} else {
				$(this.el).html(JST.select_field({
						name : this.filter.name,
						value : "",
						values : b.values,
						allowNull : true
					}))
			}
			this.$("select").bind("change", function () {
				var c = a.$("select").val();
				if (c == "edit_values") {
					new App.Views.Options({
						name : b.name,
						values : b.values
					})
				} else {
					if (c == "") {
						App.showFilter(a.filter.id, App.currentKlass.id)
					} else {
						params = "?string_field_value=" + c;
						App.showFilter(a.filter.id + params, App.currentKlass.id);
						App.defaultAttributes = {};
						App.defaultAttributes[a.filter.field.toLowerCase()] = c
					}
				}
			})
		}
	});
