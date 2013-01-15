//views/fields_view.js	
BaseFieldView = Backbone.View.extend({
			renderStatic : function (b, a) {
				$(this.el).html(JST.static_field({
							name : b,
							content : a || ""
						}))
			}
		});
BoolFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				}
				return this.$("input").attr("checked") ? 1 : 0
			},
			render : function () {
				var a = this;
				var d = this.options.fieldName;
				if (this.options.uneditable) {
					var c = Number(this.model.get(d)) == 1 ? "yes" : "no";
					this.renderStatic(d, c);
					return
				}
				var b = this.options.editor ? (this.model.get(this.options.editor) == App.user.id) : true;
				$(this.el).html(JST.bool_field({
							name : d,
							value : Number(this.model.get(d) || 0),
							editable : b
						}));
				this.$("input").bind("change", function () {
						a.trigger("shouldSave")
					})
			}
		});
CreatedAtFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.render()
			},
			value : function () {
				return this.model.isNew() ? "" : this.model.get("created_at")
			},
			render : function () {
				var c = this.options.fieldName;
				var b = this.model.get("created_at");
				var a = this.model.isNew() ? "" : new Date(b).toString("h:mmtt ").toLowerCase() + new Date(b).toString("MMMM d, yyyy");
				this.renderStatic(c, a)
			}
		});
CurrentUserFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				var a = this.options.fieldName;
				if (!this.model.get(a)) {
					this.model.attributes[a] = this.model.get("creator_id")
				}
				this.render()
			},
			value : function () {
				return this.model.isNew() ? App.user.id : this.model.get(this.options.fieldName)
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				var b = this.model.isNew() ? App.user.email : App.users.get(this.model.get(c)).get("email");
				this.renderStatic(c, b)
			}
		});
DateFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.date = this.model.get(this.options.fieldName) ? new Date(this.model.get(this.options.fieldName)) : "";
				this.render()
			},
			value : function () {
				return this.date
			},
			render : function () {
				this.date = this.model.get(this.options.fieldName) ? new Date(this.model.get(this.options.fieldName)) : "";
				var a = this;
				var c = this.options.fieldName;
				var b = this.date.toString(App.DateFormat);
				if (this.options.uneditable) {
					this.renderStatic(c, b);
					return
				}
				$(this.el).html(JST.string_field({
							name : c,
							value : b
						}));
				this.$("input").datepicker({
						dateFormat : "m/d/y",
						onSelect : function (f, d) {
							a.date = $.datepicker.parseDate("m/d/y", a.$("input").val());
							a.trigger("shouldSave")
						}
					})
			}
		});
FileFieldView = Backbone.View.extend({
			className : "field-row",
			events : {
				"click a" : "openFile",
			},
			extensionMap : {
				bmp : "image/bmp",
				gif : "image/gif",
				jpg : "image/jpeg",
				jpeg : "image/jpeg",
				png : "image/png",
				avi : "video/x-msvideo",
				doc : "application/vnd.ms-word",
				docx : "application/vnd.ms-word",
				html : "text/html",
				ico : "image/x-icon",
				mov : "video/quicktime",
				mp3 : "audio/mpeg",
				pdf : "application/pdf",
				ppt : "application/vnd.ms-powerpoint",
				pptx : "application/vnd.ms-powerpoint",
				rtf : "application/rtf",
				txt : "plain/text",
				wav : "audio/x-wav",
				zip : "application/zip"
			},
			genericContent : "application/octet-stream",
			initialize : function () {
				_(this).bindAll("value", "render", "openFile");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render()
			},
			value : function () {
				return $("#" + this.options.fieldName + "-link").attr("href").replace("http://s3.amazonaws.com/opzi-blackcomb/", "")
			},
			openFile : function () {
				window.open($("#" + this.options.fieldName + "-link").attr("href"));
				return false
			},
			render : function () {
				var a = this;
				var e = this.options.fieldName;
				if (this.model.isNew()) {
					$(this.el).html("<label>" + e + '</label><a id="' + e + '-link" href=""></a><span class="save-first">Record must be saved before you can attach a file</span>');
					return
				}
				$(this.el).html(JST.file_field({
							name : e,
							id : this.model.id
						}));
				existing_url = this.model.get(e);
				if (existing_url && existing_url != "") {
					a.$("#" + e + "-link").attr("href", "http://s3.amazonaws.com/path-to-save/" + existing_url);
					a.$("#" + e + "-link").text(existing_url.split("/").pop())
				}
				this.$(":file").change(function () {
						fileName = a.$(":file").val().split(/\\|\//).pop();
						extension = fileName.split(".").pop();
						a.$('[name="key"]').val(a.model.id + "/" + e + "/" + fileName);
						a.$('[name="Content-Type"]').val(a.extensionMap[extension] || a.genericContent);
						if (fileName != "") {
							b.removeAttr("disabled")
						}
					});
				var b = this.$(":submit");
				b.click(function () {
						$("#" + e + "-spinner").show();
						$("#" + e + "-loading-status").html(" Uploading...")
					});
				var d = true;
				var c = this.$('[name="' + e + '-result"]');
				c.load(function () {
						if (d) {
							d = false
						} else {
							try {
								var f = $('[name="' + e + '-result"]').contents().find("body").html();
								$("#" + e + "-container a").replaceWith('<a id="' + e + '-link" href="' + f + '">' + f.split("/").pop() + "</a><br /><br />");
								$("#" + e + "-spinner").hide();
								$("#" + e + "-loading-status").html("Upload succesful.");
								a.trigger("shouldSave")
							} catch (g) {
								$("#" + e + "-spinner").hide();
								$("#" + e + "-loading-status").html("Error uploading.")
							}
						}
					})
			}
		});
OptionSelectFieldView = Backbone.View.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.values = this.options.field.values;
				this.render(this.options.fieldName)
			},
			value : function () {
				return this.$("option:selected").val()
			},
			render : function () {
				var a = this;
				var b = this.options.fieldName;
				$(this.el).html(JST.option_select_field({
							name : b,
							value : this.model.get(b) || "",
							values : this.values,
							allowNull : this.options.allowNull
						}));
				this.$("select").bind("change", function () {
						if ($(this).val() == "edit_values") {
							new App.Views.Options({
									name : b,
									values : a.values
								})
						} else {
							a.trigger("shouldSave")
						}
					})
			}
		});
OptionSelectMultiFieldView = Backbone.View.extend({
			className : "field-row",
			events : {
				"click .add_value" : "add",
				"click .remove_value" : "remove"
			},
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.values = this.options.field.values;
				this.selected_values = this.model.get(this.options.fieldName) || [];
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.selected_values
				}
			},
			add : function (a) {
				this.selected_values.push(this.$("select").val());
				this.trigger("shouldSave");
				this.render()
			},
			remove : function (a) {
				this.selected_values.splice($(a.target).attr("index"), 1);
				this.trigger("shouldSave");
				this.render()
			},
			render : function () {
				var a = this;
				var b = this.options.fieldName;
				$(this.el).html(JST.option_select_multi_field({
							name : b,
							values : this.selected_values,
							options : this.values
						}));
				this.$("select").bind("change", function () {
						if ($(this).val() == "edit_values") {
							new App.Views.Options({
									name : b,
									values : a.values
								})
						}
					})
			}
		});
RecordLinkFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				var a = this;
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.klass = _.detect(App.currentApp.klasses, function (b) {
							return a.options.ref_klass == b.name
						});
				if (!this.klass) {
					console.log("No klass found for record link field ")
				}
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.$("option:selected").val()
				}
			},
			render : function () {
				var b = this;
				var d = this.options.fieldName;
				var c = this.model.get(d) || "";
				var a = _.select(App.recordsCollection.models, function (e) {
							return e.get("klass_id") == b.klass.id
						});
				if (this.options.uneditable) {
					this.renderStatic(d, c);
					return
				}
				$(this.el).html(JST.record_link_field({
							name : d,
							value : this.model.get(this.options.fieldName),
							records : a,
							ref_field : this.options.ref_field,
							ref_klass_name : b.klass.name,
							allowNull : this.options.allowNull
						}));
				this.$("select").bind("change", function () {
						b.trigger("shouldSave");
						b.render()
					})
			}
		});
RecordLinkMultiFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				var a = this;
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.klass = _.detect(App.currentApp.klasses, function (b) {
							return a.options.ref_klass == b.name
						});
				if (!this.klass) {
					console.log("No klass found for record link field ")
				}
				this.values = this.model.get(this.options.fieldName) || [];
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.values
				}
			},
			render : function () {
				var b = this;
				var c = this.options.fieldName;
				var a = _.select(App.recordsCollection.models, function (d) {
							return d.get("klass_id") == b.klass.id
						});
				$(this.el).html(JST.record_link_multi_field({
							name : c,
							values : b.values,
							records : a,
							ref_field : this.options.ref_field,
							ref_klass_name : b.klass.name,
							allowNull : this.options.allowNull
						}));
				this.$(".add_record").click(function () {
						b.values.push(b.$("select").val());
						b.trigger("shouldSave");
						b.render()
					});
				this.$(".remove_record").click(function () {
						b.values.splice($(this).attr("index"), 1);
						b.trigger("shouldSave");
						b.render()
					})
			}
		});
SelectFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.values = this.options.field.values;
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.$("option:selected").val()
				}
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				var b = this.model.get(c) || "";
				if (this.options.uneditable) {
					this.renderStatic(c, b);
					return
				}
				$(this.el).html(JST.select_field({
							name : c,
							value : b,
							values : this.values,
							allowNull : this.options.allowNull
						}));
				this.$("select").bind("change", function () {
						a.trigger("shouldSave")
					})
			}
		});
SelectMultiFieldView = Backbone.View.extend({
			className : "field-row",
			events : {
				"click .add-entry" : "addSelectField"
			},
			initialize : function () {
				_(this).bindAll("addSelectField", "value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.values = this.options.field.values;
				this.render(this.options.fieldName)
			},
			addSelectField : function () {
				this.model.get(this.options.fieldName).push("");
				this.model.trigger("change:" + this.options.fieldName)
			},
			value : function () {
				var a = [];
				$(".multiselect-" + this.options.fieldName).each(function () {
						a.push(parseInt($(this).val()))
					});
				return a
			},
			render : function () {
				var a = this;
				var b = this.options.fieldName;
				$(this.el).html(JST.select_multi_field({
							name : b,
							selected : (this.model.get(b) || []),
							values : this.values,
							allowEmpty : this.options.allowEmpty
						}));
				$(this.el).children().children("select").bind("change", function () {
						a.trigger("shouldSave")
					})
			}
		});
StringFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render()
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.$("input").val().replace(/&#39;/g, "'")
				}
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				var b = this.model.get(c);
				b = (b == null ? "" : b.replace(/'/g, "&#39;"));
				if (this.options.uneditable) {
					this.renderStatic(c, b);
					return
				}
				$(this.el).html(JST.string_field({
							name : c,
							value : b
						}));
				this.$("input").typeWatch({
						captureLength : 1,
						callback : (function () {
								a.trigger("shouldSave")
							})
					})
			}
		});
TextFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.$("textarea").val()
				}
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				var b = this.model.get(c) || "";
				if (this.options.uneditable) {
					this.renderStatic(c, b);
					return
				}
				$(this.el).html(JST.text_field({
							name : c,
							value : b,
							height : this.options.height
						}));
				this.$("textarea").typeWatch({
						captureLength : 1,
						callback : (function () {
								a.trigger("shouldSave")
							})
					})
			}
		});
TextMultiFieldView = Backbone.View.extend({
			className : "field-row",
			events : {
				"click .add-entry" : "addText",
			},
			initialize : function () {
				_(this).bindAll("value", "setEditable", "setStatic", "render", "updateValues");
				this.updateValues();
				this.model.bind("change:" + this.options.fieldName, this.updateValues);
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render(this.options.fieldName)
			},
			updateValues : function () {
				this.values = this.model.get(this.options.fieldName)
			},
			value : function () {
				var a = $("#new-" + this.options.fieldName).val();
				if (this.model.isNew() && a != "") {
					return this.values.concat([a])
				}
				return this.values
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				var b = [];
				this.values = this.values || [];
				if (this.options.sortVotes) {
					this.values = _.sortBy(this.values, function (d) {
								return d.votes ? (d.votes.length * -1) : 0
							})
				}
				_.each(this.values, function (d) {
						b.push(formatOutput(typeof(d.body) == "string" ? d.body : d))
					});
				$(this.el).html(JST.text_multi_field({
							name : c,
							values : b,
							timestamps : _.map(this.values, function (d) {
									return d.created_at ? new Date(d.created_at).toString("h:mmtt M-dd-yy").toLowerCase() : ""
								}),
							votes : _.map(this.values, function (d) {
									return d.votes ? d.votes.length : 0
								}),
							has_voted : _.map(this.values, function (d) {
									return d.votes ? (d.votes.indexOf(App.user.id) != -1) : false
								}),
							editable : a.options.editable,
							editors : a.getEditors(),
							votable : a.options.votable,
							height : a.options.height
						}));
				this.$("textarea").autoResize({
						extraSpace : 15
					});
				this.$(".edit-" + c).click(function () {
						a.setEditable(this)
					});
				this.$(".delete-" + c).click(function () {
						a.deleteEntry(this)
					});
				this.$(".vote-" + c).click(function () {
						a.vote(this)
					})
			},
			addText : function () {
				this.values.push($("#new-" + this.options.fieldName).val());
				this.trigger("shouldSave");
				this.render()
			},
			vote : function (c) {
				var a = this;
				var b = $(c).attr("index");
				var e = this.options.fieldName;
				var d = this.values[b].votes.indexOf(App.user.id);
				if (d != -1) {
					this.values[b].votes.splice(d, 1)
				} else {
					this.values[b].votes.push(App.user.id)
				}
				this.trigger("shouldSave");
				this.render()
			},
			deleteEntry : function (a) {
				this.values.splice($(a).attr("index"), 1);
				this.trigger("shouldSave");
				this.render()
			},
			setEditable : function (c) {
				var a = this;
				var b = $(c).siblings("." + this.options.fieldName)[0];
				var d = $(b).html().replace(/<br>/g, "\n");
				$(b).replaceWith("<textarea class='editform-" + this.options.fieldName + "'>" + d + "</textarea>");
				$(c).text("Save");
				$(c).unbind("click");
				$(c).click(function () {
						a.setStatic(c)
					})
			},
			setStatic : function (b) {
				var a = this;
				var d = $(b).siblings(".editform-" + this.options.fieldName)[0];
				var c = $(d).val();
				$(d).replaceWith("<span class='" + this.options.fieldName + "'>" + c + "</span>");
				this.values[$(b).attr("index")] = c;
				this.trigger("shouldSave");
				$(b).text("Edit");
				$(b).unbind("click");
				$(b).click(function () {
						a.setEditable(b)
					})
			},
			getEditors : function () {
				var a = (this.model.get(this.options.fieldName) || []);
				return _.map(a, function (b) {
						return (App.users.get(b.creator)) ? App.users.get(b.creator).get("email") : ""
					})
			}
		});
UpdatedAtFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.render()
			},
			value : function () {
				return this.model.isNew() ? "" : this.model.get("updated_at")
			},
			render : function () {
				var c = this.options.fieldName;
				var b = this.model.get("updated_at");
				var a = this.model.isNew() ? "" : new Date(b).toString("h:mtt MMMM d, yyyy").toLowerCase();
				this.renderStatic(c, a)
			}
		});
UserFieldView = BaseFieldView.extend({
			className : "field-row",
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.render(this.options.fieldName)
			},
			value : function () {
				if (this.options.uneditable) {
					return this.model.get(this.options.fieldName)
				} else {
					return this.$("option:selected").val()
				}
			},
			render : function () {
				var a = this;
				var c = this.options.fieldName;
				if (this.options.uneditable) {
					var b = this.model.get(c);
					_(App.users.models).each(function (d) {
							if (d.id == b) {
								b = d.get("email")
							}
						});
					this.renderStatic(c, b);
					return
				}
				$(this.el).html(JST.user_field({
							name : c,
							selected : (this.model.get(c) || []),
							users : App.users.models,
							allowNull : this.options.allowNull
						}));
				this.$("select").bind("change", function () {
						a.trigger("shouldSave")
					})
			}
		});
UserMultiFieldView = Backbone.View.extend({
			className : "field-row",
			events : {
				"click .toggle" : "toggle",
				"click .add" : "add",
				"click .remove" : "remove"
			},
			initialize : function () {
				_(this).bindAll("value", "render");
				this.model.bind("change:" + this.options.fieldName, this.render);
				this.values = this.model.get(this.options.fieldName) || [];
				this.render(this.options.fieldName)
			},
			toggle : function () {
				if (_.include(this.values, App.user.id)) {
					this.values = _.without(this.values, App.user.id)
				} else {
					this.values.push(App.user.id)
				}
				this.trigger("shouldSave");
				this.render()
			},
			add : function () {
				this.values.push(this.$(".add_user").val());
				this.trigger("shouldSave");
				this.render()
			},
			remove : function (a) {
				this.values = _.without(this.values, $(a.srcElement).attr("user_id"));
				this.trigger("shouldSave");
				this.render()
			},
			value : function () {
				return this.values
			},
			render : function () {
				var a = this;
				var d = this.options.fieldName;
				var c = this.model.get(d) ? _.include(this.model.get(d), App.user.id) : false;
				var b = _.select(App.users.models, function (e) {
							return _.include(a.values, e.get("id"))
						});
				$(this.el).html(JST.user_multi_field({
							name : d,
							selected : b,
							action : a.options.action,
							reverse_action : a.options.reverse_action,
							already_acted : c,
							show_users : a.options.show_users,
							add_others : a.options.add_others,
							users : App.currentApp.users
						}))
			}
		});
