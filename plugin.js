( function() {
	CKEDITOR.plugins.add( 'simplelink',
	{
		lang: 'af,ar,bg,bn,bs,ca,cs,cy,da,de,el,en,en-au,en-ca,en-gb,eo,es,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn',
		icons: 'link, unlink',


		init: function( editor ) {
			var allowed = 'a[!href]',
				  required = 'a[href]';

			editor.addCommand( 'link', new CKEDITOR.dialogCommand( 'link', {
				allowedContent: 'div{*}; iframe{*}[!width,!height,!src,!frameborder,!allowfullscreen]; object param[*]'
			}));
			editor.addCommand( 'unlink', new CKEDITOR.unlinkCommand() );

			if ( editor.ui.addButton ) {
				editor.ui.addButton( 'Link(simple)',
				{
					label : editor.lang.simplelink.button,
					toolbar : 'insert',
					command : 'link',
					icon : this.path + 'icons/link.png'
				});
				editor.ui.addButton( 'Unlink(simple)',
				{
					label : editor.lang.simplelink.unlink,
					toolbar : 'insert',
					command : 'unlink',
					icon : this.path + 'icons/unlink.png'
				});
			}

			editor.on( 'doubleclick', function( evt ) {
				var element = CKEDITOR.plugins.link.getSelectedLink( editor ) || evt.data.element;
				if ( !element.isReadOnly() ) {
					if ( element.is( 'a' ) ) {
						evt.data.dialog = 'link';
						evt.data.link = element;
					} 
				}
			}, null, null, 0 );

			if ( editor.addMenuItems ) {
				editor.addMenuGroup( 'simplelink' );
				editor.addMenuItems( {
					link: {
						label: editor.lang.simplelink.menu,
						icon : this.path + 'icons/link.png',
						command: 'link',
						group: 'simplelink',
						order: 1
					},

					unlink: {
						label: editor.lang.simplelink.unlink,
						icon : this.path + 'icons/unlink.png',
						command: 'unlink',
						group: 'simplelink',
						order: 5
					}
				} );
			}

			if ( editor.contextMenu ) {
				editor.contextMenu.addListener( function( element ) {
					if ( !element || element.isReadOnly() )
						return null;

					var anchor = CKEDITOR.plugins.link.tryRestoreFakeAnchor( editor, element );

					if ( !anchor && !( anchor = CKEDITOR.plugins.link.getSelectedLink( editor ) ) )
						return null;

					var menu = {};

					if ( anchor.getAttribute( 'href' ) && anchor.getChildCount() )
						menu = { link: CKEDITOR.TRISTATE_OFF, unlink: CKEDITOR.TRISTATE_OFF };

					if ( anchor && anchor.hasAttribute( 'name' ) )
						menu.anchor = menu.removeAnchor = CKEDITOR.TRISTATE_OFF;

					return menu;
				} );
			}



			CKEDITOR.dialog.add( 'link', function ( instance )
			{
				return {
					allowedContent: "a[href,target]",
					title: editor.lang.simplelink.title,
					minWidth: 550,
					minHeight: 100,
					resizable: CKEDITOR.DIALOG_RESIZE_NONE,
					contents:[{
						id: "SimpleLink",
						label: "SimpleLink",
						elements:[{
							type: "text",
							label: "URL",
							id: "edp-URL",
							validate: CKEDITOR.dialog.validate.notEmpty( editor.lang.simplelink.nourl ),
			        setup: function( element ) {
			        	var href = element.getAttribute("href");
			        	var isExternalURL = /^(http|https):\/\//;
			        	if(href) {
			        			if(!isExternalURL.test(href)) {
			        				href = "http://" + href;
			        			}
				            this.setValue(href);
				        }
			        },
			        commit: function(element) {
			        	var href = this.getValue();
			        	var isExternalURL = /^(http|https):\/\//;
			        	if(href) {
			        			if(!isExternalURL.test(href)) {
			        				href = "http://" + href;
			        			}
				            element.setAttribute("href", href);
				            if(!element.getText()) {
			        				element.setText(this.getValue());
			        			}
				        }        	
			        }				
						}, {
							type: "text",
							label: editor.lang.simplelink.labeltext,
							id: "edp-text-display",
			        setup: function( element ) {
			            this.setValue( element.getText() );
			        },
			        commit: function(element) {
			        	var currentValue = this.getValue();
			        	if(currentValue !== "" && currentValue !== null) {
				        	element.setText(currentValue);
				        }
			        }	
						}, {
							type: "checkbox",
							id: 'target',
							label: editor.lang.simplelink.labelcheckbox,
			        setup: function( element ) {
			        	var target = element.getAttribute("target");
			        	if(target == "_blank" || target == null) {
									this.setValue( true );
			           }
			           else{
			           	this.setValue( false );
			           }
			        },
			        commit: function(element) {
			        	var target = this.getValue();
								if (target) {
									element.setAttribute("target","_blank");
								} else {
									element.setAttribute("target","_self");
								}
			        },
						}]
					}],
					onShow: function() {
						var selection = editor.getSelection();
						var selector = selection.getStartElement()
						var element;
						
						if(selector) {
							 element = selector.getAscendant( 'a', true );
						}
						if ( !element || element.getName() != 'a' ) {
							element = editor.document.createElement( 'a' );
							if(selection) {
								element.setText(selection.getSelectedText());
							}
			        this.insertMode = true;
						}
						else {
							this.insertMode = false;
						}
						this.element = element;
						this.setupContent(this.element);
					},
					onOk: function() {
						var dialog = this;
						var anchorElement = this.element;
						this.commitContent(this.element);
						if(this.insertMode) {
							editor.insertElement(this.element);
						}
					}
				};
			});
		}
	});






	CKEDITOR.unlinkCommand = function() {};
	CKEDITOR.unlinkCommand.prototype = {
		exec: function( editor ) {
			var style = new CKEDITOR.style( { element: 'a', type: CKEDITOR.STYLE_INLINE, alwaysRemoveElement: 1 } );
			editor.removeStyle( style );
		},

		refresh: function( editor, path ) {
			// Despite our initial hope, document.queryCommandEnabled() does not work
			// for this in Firefox. So we must detect the state by element paths.

			var element = path.lastElement && path.lastElement.getAscendant( 'a', true );

			if ( element && element.getName() == 'a' && element.getAttribute( 'href' ) && element.getChildCount() )
				this.setState( CKEDITOR.TRISTATE_OFF );
			else
				this.setState( CKEDITOR.TRISTATE_DISABLED );
		},

		contextSensitive: 1,
		startDisabled: 1,
		requiredContent: 'a[href]'
	};
})();