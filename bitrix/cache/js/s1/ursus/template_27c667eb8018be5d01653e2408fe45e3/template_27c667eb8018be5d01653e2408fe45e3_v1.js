
; /* Start:"a:4:{s:4:"full";s:100:"/local/templates/ursus/components/bitrix/sale.location.selector.search/geo/script.js?159846321811877";s:6:"source";s:84:"/local/templates/ursus/components/bitrix/sale.location.selector.search/geo/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
BX.namespace('BX.Sale.component.location.selector');

if(typeof BX.Sale.component.location.selector.search == 'undefined' && typeof BX.ui != 'undefined' && typeof BX.ui.widget != 'undefined'){

	BX.Sale.component.location.selector.search = function(opts, nf){

		this.parentConstruct(BX.Sale.component.location.selector.search, opts);

		BX.merge(this, {
			opts: {

				usePagingOnScroll: 		true,
				pageSize: 				10,
				//scrollThrottleTimeout: 	100,
				arrowScrollAdditional: 	2,
				pageUpWardOffset: 		3,
				provideLinkBy: 			'id',

				bindEvents: {

					'after-input-value-modify': function(){

						this.ctrls.fullRoute.value = '';

					},
					'after-select-item': function(itemId){

						var so = this.opts;
						var cItem = this.vars.cache.nodes[itemId];

						var path = cItem.DISPLAY;
						if(typeof cItem.PATH == 'object'){
							for(var i = 0; i < cItem.PATH.length; i++){
								path += ', '+this.vars.cache.path[cItem.PATH[i]]; // deprecated
							}
						}

						this.ctrls.inputs.fake.setAttribute('title', path);
						this.ctrls.fullRoute.value = path;
                                                
						if(typeof this.opts.callback == 'string' && this.opts.callback.length > 0 && this.opts.callback in window){
                                                   window[this.opts.callback].apply(this, [itemId, this]); 
                                                }
							
					},
					'after-deselect-item': function(){
						this.ctrls.fullRoute.value = '';
						this.ctrls.inputs.fake.setAttribute('title', '');
					},
					'before-render-variant': function(itemData){

						if(itemData.PATH.length > 0){
							var path = '';
							for(var i = 0; i < itemData.PATH.length; i++)
								path += ', '+this.vars.cache.path[itemData.PATH[i]];

							itemData.PATH = path;
						}else
							itemData.PATH = '';
	
						var query = '';

						if(this.vars && this.vars.lastQuery && this.vars.lastQuery.QUERY)
							query = this.vars.lastQuery.QUERY;

						if(BX.type.isNotEmptyString(query)){
							var chunks = [];
							if(this.opts.wrapSeparate)
								chunks = query.split(/\s+/);
							else
								chunks = [query];

							itemData['=display_wrapped'] = BX.util.wrapSubstring(itemData.DISPLAY+itemData.PATH, chunks, this.opts.wrapTagName, true);
						}else
							itemData['=display_wrapped'] = BX.util.htmlspecialchars(itemData.DISPLAY);
					}
				}
			},
			vars: {
				cache: {
					path: 			{},
					nodesByCode: 	{}
				}
			},
			sys: {
				code: 'sls'
			}
		});
		
		this.handleInitStack(nf, BX.Sale.component.location.selector.search, opts);
	}
	BX.extend(BX.Sale.component.location.selector.search, BX.ui.autoComplete);
	BX.merge(BX.Sale.component.location.selector.search.prototype, {

		// member of stack of initializers, must be defined even if do nothing
		init: function(){

			// deprecated begin
			if(typeof this.opts.pathNames == 'object')
				BX.merge(this.vars.cache.path, this.opts.pathNames);
			// deprecated end

			this.pushFuncStack('buildUpDOM', BX.Sale.component.location.selector.search);
			this.pushFuncStack('bindEvents', BX.Sale.component.location.selector.search);
		},

		buildUpDOM: function(){

			var sc = this.ctrls,
				so = this.opts,
				sv = this.vars,
				ctx = this,
				code = this.sys.code;
			
			// full route node
			sc.fullRoute = BX.create('input', {
				props: {
					className: 'bx-ui-'+code+'-route'
				},
				attrs: {
					type: 'text',
					disabled: 'disabled',
					autocomplete: 'off'
				}
			});

			// todo: use metrics instead!
			BX.style(sc.fullRoute, 'paddingTop', BX.style(sc.inputs.fake, 'paddingTop'));
			BX.style(sc.fullRoute, 'paddingLeft', BX.style(sc.inputs.fake, 'paddingLeft'));
			BX.style(sc.fullRoute, 'paddingRight', '0px');
			BX.style(sc.fullRoute, 'paddingBottom', '0px');

			BX.style(sc.fullRoute, 'marginTop', BX.style(sc.inputs.fake, 'marginTop'));
			BX.style(sc.fullRoute, 'marginLeft', BX.style(sc.inputs.fake, 'marginLeft'));
			BX.style(sc.fullRoute, 'marginRight', '0px');
			BX.style(sc.fullRoute, 'marginBottom', '0px');

			if(BX.style(sc.inputs.fake, 'borderTopStyle') != 'none'){
				BX.style(sc.fullRoute, 'borderTopStyle', 'solid');
				BX.style(sc.fullRoute, 'borderTopColor', 'transparent');
				BX.style(sc.fullRoute, 'borderTopWidth', BX.style(sc.inputs.fake, 'borderTopWidth'));
			}

			if(BX.style(sc.inputs.fake, 'borderLeftStyle') != 'none'){
				BX.style(sc.fullRoute, 'borderLeftStyle', 'solid');
				BX.style(sc.fullRoute, 'borderLeftColor', 'transparent');
				BX.style(sc.fullRoute, 'borderLeftWidth', BX.style(sc.inputs.fake, 'borderLeftWidth'));
			}

			BX.prepend(sc.fullRoute, sc.container);

			sc.inputBlock = this.getControl('input-block');
			sc.loader = this.getControl('loader');
		},

		bindEvents: function(){

			var ctx = this;

			// quick links
			BX.bindDelegate(this.getControl('quick-locations', true), 'click', {tag: 'a'}, function(){
				ctx.setValueByLocationId(BX.data(this, 'id'));
			});

			this.vars.outSideClickScope = this.ctrls.inputBlock;
		},

		////////// PUBLIC: free to use outside

		// location id is just a value in terms of autocomplete
		setValueByLocationId: function(id, autoSelect){
			BX.Sale.component.location.selector.search.superclass.setValue.apply(this, [id, autoSelect]);
		},

		setValueByLocationIds: function(locationsData){
			if(locationsData.IDS)
			{
				this.displayPage(
					{
						'VALUE': locationsData.IDS,
						'order': {'TYPE_ID': 'ASC', 'NAME.NAME': 'ASC'}
					}
				);
			}
		},

		setValueByLocationCode: function(code, autoSelect){

			var sv = this.vars,
				so = this.opts,
				sc = this.ctrls,
				ctx = this;

			this.hideError();

			if(code == null || code == false || typeof code == 'undefined' || code.toString().length == 0){ // deselect

				this.resetVariables();

				BX.cleanNode(sc.vars);

				if(BX.type.isElementNode(sc.nothingFound))
					BX.hide(sc.nothingFound);

				this.fireEvent('after-deselect-item');
				this.fireEvent('after-clear-selection');

				return;
			};

			if(autoSelect !== false)
				sv.forceSelectSingeOnce = true;

			if(typeof sv.cache.nodesByCode[code] == 'undefined'){

				// lazyload it...
				this.resetNavVariables();
				
				ctx.downloadBundle({CODE: code}, function(data){

					ctx.fillCache(data, false); // storing item in the cache

					if(typeof sv.cache.nodesByCode[code] == 'undefined'){ // still not found
						ctx.showNothingFound();
					}else{

						var value = sv.cache.nodesByCode[code].VALUE;

						//////////////////
						if(so.autoSelectIfOneVariant || sv.forceSelectSingeOnce)
							ctx.selectItem(value);
						else
							ctx.displayVariants([value]);
						//////////////////
					}
				}, function(){
					sv.forceSelectSingeOnce = false;
				});

			}else{

				var value = sv.cache.nodesByCode[code].VALUE;

				if(sv.forceSelectSingeOnce)
					this.selectItem(value);
				else
					this.displayVariants([value]);

				sv.forceSelectSingeOnce = false;
			}
		},

		getNodeByValue: function(value){
			if(this.opts.provideLinkBy == 'id')
				return this.vars.cache.nodes[value];
			else
				return this.vars.cache.nodesByCode[value];
		},

		getNodeByLocationId: function(value){
			return this.vars.cache.nodes[value];
		},

		setValue: function(value){

			if(this.opts.provideLinkBy == 'id')
				BX.Sale.component.location.selector.search.superclass.setValue.apply(this, [value]);
			else
				this.setValueByLocationCode(value);
		},

		getValue: function(){
			if(this.opts.provideLinkBy == 'id')
				return this.vars.value === false ? '' : this.vars.value;
			else{
				return this.vars.value ? this.vars.cache.nodes[this.vars.value].CODE : '';
			}
		},

		getSelectedPath: function(){

			var sv = this.vars,
				result = [];

			if(typeof sv.value == 'undefined' || sv.value == false || sv.value == '')
				return result;

			if(typeof sv.cache.nodes[sv.value] != 'undefined'){
				var item = BX.clone(sv.cache.nodes[sv.value]);
				if(typeof item.TYPE_ID != 'undefined' && typeof this.opts.types != 'undefined')
					item.TYPE = this.opts.types[item.TYPE_ID].CODE;

				var path = item.PATH; 
				delete(item.PATH);
				result.push(item);

				if(typeof path != 'undefined'){
					for(var k in path){
						var item = BX.clone(sv.cache.nodes[path[k]]);
						if(typeof item.TYPE_ID != 'undefined' && typeof this.opts.types != 'undefined')
							item.TYPE = this.opts.types[item.TYPE_ID].CODE;

						delete(item.PATH);

						result.push(item);
					}
				}
			}

			return result;
		},

		////////// PRIVATE: forbidden to use outside (for compatibility reasons)

		setInitialValue: function(){

			if(this.opts.selectedItem !== false) // there will be always a value as ID, no matter what this.opts.provideLinkBy is equal to
				this.setValueByLocationId(this.opts.selectedItem);
			else if(this.ctrls.inputs.origin.value.length > 0) // there colud be eiter ID or CODE
			{
				if(this.opts.provideLinkBy == 'id')
					this.setValueByLocationId(this.ctrls.inputs.origin.value);
				else
					this.setValueByLocationCode(this.ctrls.inputs.origin.value);
			}
		},

		addItem2Cache: function(item){
			this.vars.cache.nodes[item.VALUE] = item;
			this.vars.cache.nodesByCode[item.CODE] = item;
		},

		refineRequest: function(request){

			var filter = {};
			if(typeof request['QUERY'] != 'undefined') // search by words
				filter['=PHRASE'] = request.QUERY;

			if(typeof request['VALUE'] != 'undefined') // search by id
				filter['=ID'] = request.VALUE;

			if(typeof request['CODE'] != 'undefined') // search by code
				filter['=CODE'] = request.CODE;

			if(typeof this.opts.query.BEHAVIOUR.LANGUAGE_ID != 'undefined')
				filter['=NAME.LANGUAGE_ID'] = this.opts.query.BEHAVIOUR.LANGUAGE_ID;

			if(BX.type.isNotEmptyString(this.opts.query.FILTER.SITE_ID))
				filter['=SITE_ID'] = this.opts.query.FILTER.SITE_ID;

			var result = {
				'select': {
					'VALUE': 'ID',
					'DISPLAY': 'NAME.NAME',
					'1': 'CODE',
					'2': 'TYPE_ID'
				},
				'additionals': {
					'1': 'PATH'
				},
				'filter': filter,
				'version': '2'
			};

			if(typeof request['order'] != 'undefined')
				result['order'] = request.order;

			return result;
		},

		refineResponce: function(responce, request){

			if(typeof responce.ETC.PATH_ITEMS != 'undefined')
			{
				// deprecated begin
				for(var k in responce.ETC.PATH_ITEMS){
					if(BX.type.isNotEmptyString(responce.ETC.PATH_ITEMS[k].DISPLAY))
						this.vars.cache.path[k] = responce.ETC.PATH_ITEMS[k].DISPLAY;
				}
				// deprecated end

				for(var k in responce.ITEMS){

					var item = responce.ITEMS[k];

					if(typeof item.PATH != 'undefined')
					{
						var subPath = BX.clone(item.PATH);
						for(var p in item.PATH)
						{
							var pItemId = item.PATH[p];

							subPath.shift();
							if(typeof this.vars.cache.nodes[pItemId] == 'undefined' && typeof responce.ETC.PATH_ITEMS[pItemId] != 'undefined'){

								var pItem = BX.clone(responce.ETC.PATH_ITEMS[pItemId]);
								pItem.PATH = BX.clone(subPath);
								this.vars.cache.nodes[pItemId] = pItem;
							}
						}
					}
				}
			}

			return responce.ITEMS;
		},

		refineItems: function(items){
			return items;
		},

		refineItemDataForTemplate: function(itemData){
			return itemData;
		},

		// custom value getter (obsolete method)
		getSelectorValue: function(value){

			if(this.opts.provideLinkBy == 'id')
				return value;

			if(typeof this.vars.cache.nodes[value] != 'undefined')
				return this.vars.cache.nodes[value].CODE;
			else
				return '';
		},

		whenLoaderToggle: function(way){
			BX[way ? 'show' : 'hide'](this.ctrls.loader);
		}

	});
}
$(function(){
    $( ".bx-ui-sls-fake" ).focus(function() {
        $(this).closest(".bx-ui-sls-input-block").addClass('focus');
    }).focusout(function() {
        $(this).closest(".bx-ui-sls-input-block").removeClass('focus');
    });
});
/* End */
;
; /* Start:"a:4:{s:4:"full";s:88:"/local/templates/ursus/components/bxmod/auth.dialog/zend-ursus/script.js?165236740325474";s:6:"source";s:72:"/local/templates/ursus/components/bxmod/auth.dialog/zend-ursus/script.js";s:3:"min";s:0:"";s:3:"map";s:0:"";}"*/
BxmodAuth = {
    // ������� � ������� �������������� �������
    ToRestore: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        BxmodAuth.ClearHints(dialog);
        
        if ( dialog.find("input[name='bxmodAuthEmail']").val() != "" )
        {
            dialog.find("input[name='bxmodAuthRestoreEmail']").val( dialog.find("input[name='bxmodAuthEmail']").val() );
        }
        
        BxmodAuth.MoveTo( dialog.find("form.bxmodAuthRestore") );
        
        return false;
    },
    // ������� � ������� �����������/�����������

    // Переход к диалогу авторизации/регистрации
    ToRegister: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");

        BxmodAuth.ClearHints(dialog);
        BxmodAuth.MoveTo( dialog.find("form.bxmodAuthRegister") );

        return false;
    },
    ToLogin: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        BxmodAuth.ClearHints(dialog);
        
        BxmodAuth.MoveTo( dialog.find("form.bxmodAuthLogin") );

        return false;
    },
    // ������� �����������/�����������
    DoLogin: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        var sendButton = dialog.find("button.bxmodAuthLoginButton");
        if ( !BxmodAuth.SetLoading(sendButton) )
        {
            return false;
        }
        
        BxmodAuth.ClearHints(dialog);
        
        dialog.find("form.bxmodAuthConfirm input[name='bxmodAuthConfirmLogin']").val( dialog.find("form.bxmodAuthLogin input[name='bxmodAuthEmail']").val() );
        if ( dialog.find("form.bxmodAuthLogin input[name='bxmodAuthRemember']:checked").length > 0 )
        {
            dialog.find("form.bxmodAuthConfirm").append('<input type="hidden" name="bxmodAuthRemember" value="Y">');
        }
        else
        {
            dialog.find("form.bxmodAuthConfirm input[name='bxmodAuthRemember']").remove();
        }
        
        $.ajax({
            url: '/ajax/auth/',
            type: "post",
            data: dialog.find("form.bxmodAuthLogin").serialize(),
            success: function ( data ) {
                
                BxmodAuth.ReSetLoading(sendButton);
                
                if ( !BxmodAuth.CheckResp( dialog, data ) )
                {
                    if ( data.indexOf("RegisterEmailConfirm") > -1 || data.indexOf("RegisterPhoneConfirm") > -1 )
                    {
                        dialog.find("form.bxmodAuthConfirm .email, form.bxmodAuthConfirm .phone").hide();
                        
                        if ( data.indexOf("RegisterPhoneConfirm") > -1 )
                        {
                            dialog.find("form.bxmodAuthConfirm .phone").show();
                        }
                        else if ( data.indexOf("RegisterEmailConfirm") > -1 )
                        {
                            dialog.find("form.bxmodAuthConfirm .email").show();
                        }
                        
                        BxmodAuth.MoveTo( dialog.find("form.bxmodAuthConfirm") );
                    }
                    else
                    {
                        BxmodAuth.ToAllError( dialog );
                    }
                }
                else
                {
                    BxmodAuth.ReloadCaptcha(dialog.find("div.bxmodAuthCaptchaBlock.taCaptchaLogin"));
                }
            }
        });
        
        return false;
    },
    // ������� ������������ ������
    DoRestore: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        var sendButton = dialog.find("button.bxmodAuthRestoreButton");
        if ( !BxmodAuth.SetLoading(sendButton) ) return false;
        
        BxmodAuth.ClearHints(dialog);
        
        dialog.find("div.bxmodAuthSMSLimit").addClass("hidden").html("");
        
        BxmodAuth.MoveTo( dialog.find("form.bxmodAuthRestore") );
        
        $.ajax({
            url: '/ajax/auth/',
            type: "post",
            data: dialog.find("form.bxmodAuthRestore").serialize(),
            success: function ( data ) {
                
                BxmodAuth.ReSetLoading(sendButton);
                
                if ( !BxmodAuth.CheckResp( dialog, data ) )
                {
                    // �������� �������� ���� �������������� �������
                    if ( data.indexOf("RestoreSend") > -1 )
                    {
                        dialog.find("div.bxmodAuthRestoreSendEmail, div.bxmodAuthRestoreSendPhone").hide();
                        
                        dialog.find("form.bxmodAuthSetPass input[name='bxmodAuthRestoreLogin']").remove();
                        dialog.find("form.bxmodAuthSetPass").append('<input type="hidden" name="bxmodAuthRestoreLogin" value="'+ dialog.find("form.bxmodAuthRestore input[name='bxmodAuthRestoreEmail']").val() +'">');
                        
                        // ���������� �� email
                        if ( data.indexOf("Email") > -1 )
                        {
                            dialog.find("div.bxmodAuthRestoreSendEmail").show();
                        }
                        // ���������� �� SMS
                        else
                        {
                            dialog.find("div.bxmodAuthRestoreSendPhone").show();
                        }
                        
                        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthRestoreSend") );
                    }
                }
                else
                {
                    BxmodAuth.ReloadCaptcha(dialog.find("div.bxmodAuthCaptchaBlock.taCaptchaRestore"));
                }
            }
        });
        
        return false;
    },
    // ������������� ����� ��� ������ ��������
    DoConfirm: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        var sendButton = dialog.find("button.bxmodAuthConfirmButton");
        if ( !BxmodAuth.SetLoading(sendButton) ) return false;
        
        BxmodAuth.ClearHints(dialog);
        
        $.ajax({
            url: '/ajax/auth/',
            type: "post",
            data: dialog.find("form.bxmodAuthConfirm").serialize(),
            success: function ( data ) {
                
                BxmodAuth.ReSetLoading(sendButton);
                
                if ( !BxmodAuth.CheckResp( dialog, data ) )
                {
                    BxmodAuth.ToAllError( dialog );
                }
            }
        });
        
        return false;
    },
    // ������� ��������� ������ ������
    DoSetPass: function (el)
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        
        var sendButton = dialog.find("button.bxmodAuthSetPassButton");
        if ( !BxmodAuth.SetLoading(sendButton) ) return false;
        
        BxmodAuth.ClearHints(dialog);
        
        $.ajax({
            url: '/ajax/auth/',
            type: "post",
            data: dialog.find("form.bxmodAuthSetPass").serialize(),
            success: function ( data ) {

                BxmodAuth.ReSetLoading(sendButton);
                
                if ( !BxmodAuth.CheckResp( dialog, data ) )
                {
                    if ( data.indexOf("Restore") > -1 )
                    {
                        document.BxmodAuthRT = setInterval("BxmodAuth.ReloadTimer('#"+ dialog.find("div.bxmodAuthSuccessRestore p.bxmodAuthMess span").attr("id") +"')", 1000);
                        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthSuccessRestore") );
                    }
                }
            }
        });
        
        return false;
    },
    // �������� ������ ������� �� ������� ������
    CheckResp: function ( dialog, data )
    {
        if ( data.indexOf("[Error]:") > -1 )
        {
            data = data.split("[Error]:");
            
            // ���� ������ � ����� ������ � ���� ������, �� ���������� ��� ��������
            if ( data[0] == "bxmodAuthCaptcha" && dialog.find("div.bxmodAuthCaptchaBlock").hasClass("hidden") )
            {
                dialog.find("div.bxmodAuthCaptchaBlock").removeClass("hidden");
                BxmodAuth.MoveTo( dialog.find("form.bxmodAuthLogin") );
            }
            // ���� � ������ ���������� � ������ SMS
            else if ( data[0] == "sms_limit" )
            {
                if ( !dialog.find("div.bxmodAuthSMSLimit").hasClass("taTimer") )
                {
                    dialog.find("div.bxmodAuthSMSLimit").addClass("taTimer");
                    setInterval("BxmodAuth.Timer( $('#"+ dialog.find("div.bxmodAuthSMSLimit").attr("id") +"') )", 1000);
                }
                dialog.find("div.bxmodAuthSMSLimit").html(data[1]).removeClass("hidden");
                
                BxmodAuth.MoveTo( dialog.find("form.bxmodAuthRestore") );
            }
            
            var el = dialog.find("input[name='" + data[0] + "']");
            
            el.addClass("bxmodAuthInputError").focus();
            
            // ���������� ���� � ���� � �������
            $('<div class="bxmodAuthHint"><div>'+ data[1] +'</div></div>').insertAfter(el).css({
                marginLeft: el.width() + 30,
                marginTop: el.height() * -1 - 14,
            }).animate({
                marginLeft: el.width() + 10,
                opacity: 1
            }, 200).click(function(){
                $(this).remove();
            });

            return true;
        }
        // �������� �����
        else if ( data == "Login" )
        {
            BxmodAuth.ToSuccessLogin( dialog );
            return true;
        }
        // �������� �����������
        else if ( data == "Register" )
        {
            BxmodAuth.ToSuccessRegister( dialog );
            return true;
        }
        
        return false;
    },
    // �������� ������ � ��������
    ClearHints: function ( dialog )
    {
        dialog.find("div.bxmodAuthHint").remove();
        dialog.find("input").removeClass("bxmodAuthInputError");
    },
    // ���������� CAPTCHA
    ReloadCaptcha: function ( captchaBlock )
    {
        if ( captchaBlock.find("a").hasClass("taCaptchaLoading") )
        {
            return false;
        }
        
        captchaBlock.find("a").addClass("taCaptchaLoading").stop().animate({
            opacity: 0.5
        }, 200);
        
        captchaBlock.find("img.captcha").stop().animate({
            width: 360,
            height: 80,
            marginLeft: -106,
            marginTop: -22,
            opacity: 0
        }, 500);
        
        $.get( document.location.pathname + '?reCaptcha=true&SHOW_FORM_DIALOG=true', function( data ) {
            captchaBlock.find("input.captchaSid").val(data);
            captchaBlock.find("input.captchaWord").val("");
            captchaBlock.find("img.captcha").attr('src', '/bitrix/tools/captcha.php?captcha_sid=' + data).load(function(){
                captchaBlock.find("img.captcha").stop().animate({
                    width: 180,
                    height: 40,
                    marginLeft: -1,
                    marginTop: -1,
                    opacity: 1
                }, 300, function(){
                    captchaBlock.find("div.bxmodAuthCaptchaImg a").fadeIn();
                });
                captchaBlock.find("a").removeClass("taCaptchaLoading").stop().animate({
                    opacity: 1
                }, 200);
            });
        });
    },
    // ������ ������� ��������� �������
    Timer: function ( timer )
    {
        var hEl = timer.find("span.h");
        var mEl = timer.find("span.m");
        var sEl = timer.find("span.s");
        
        var allTime = (parseInt( hEl.html() ) * 3600 + parseInt( mEl.html() ) * 60 + parseInt( sEl.html() )) - 1;
        
        // ���� ������ ������ ����, �� �������� ��������� � ��������
        if ( allTime <= 0 )
        {
            timer.hide();
            BxmodAuth.MoveTo( timer.closest("div.bxmodAuthDialog").find("form.bxmodAuthRestore") );
        }
        
        var hNew = (Math.floor( allTime / 3600 )).toString();
        var mNew = (Math.floor( ( allTime - hNew * 3600 ) / 60 )).toString();
        var sNew = (allTime - (hNew * 3600) - (mNew * 60)).toString();
        
        if ( hNew.length < 2 ) hNew = "0" + hNew;
        if ( mNew.length < 2 ) mNew = "0" + mNew;
        if ( sNew.length < 2 ) sNew = "0" + sNew;
        
        hEl.html( hNew );
        mEl.html( mNew );
        sEl.html( sNew );
    },
    // �������� ������� �����������/�����������
    ShowDialog: function ( dialog )
    {
        var over = dialog.prev();
        
        dialog.find("a.bxmodAuthDialogClose").css({ left: dialog.width() + 17 });
        
        over.show();
        dialog.show();

        dialog.css({
            left: (($(window).width() - $('body').find('.bxmodAuthDialog ').outerWidth()) / 2 ),
            marginTop: ( dialog.height() / 2 + 100 ) * -1,
            marginLeft: 0
        });
    },
    // �������� ��������� �� �������� �����������
    ToSuccessLogin: function ( dialog )
    {
        document.BxmodAuthRT = setInterval("BxmodAuth.ReloadTimer('#"+ dialog.find("div.bxmodAuthSuccessLogin p.bxmodAuthMess span").attr("id") +"')", 1000);
        var email =  dialog.find("form.bxmodAuthLogin input[name='bxmodAuthEmail']").val();


        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthSuccessLogin") );
    },
    // �������� ��������� �� �������� �����������
    ToSuccessRegister: function ( dialog )
    {
        document.BxmodAuthRT = setInterval("BxmodAuth.ReloadTimer('#"+ dialog.find("div.bxmodAuthSuccessRegister p.bxmodAuthMess span").attr("id") +"')", 1000);
        var email =  dialog.find("form.bxmodAuthLogin input[name='bxmodAuthEmail']").val();
     
        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthSuccessRegister") );
    },
    // �������� ��������� �� ����� ������
    ToAllError: function ( dialog )
    {
        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthAllError") );
    },
    // �������� ������� � ������� � ����� ��������� ������ ������
    ToRestoreForm: function ( type )
    {
        var el = $(".bxmodAuthShowLink:first");
        var dialog = el.prev();
        
        BxmodAuth.ShowDialog( dialog );
        
        if( type == "email" )
        {
            dialog.find("div.bxmodAuthRestoreSendEmail").show();
        }
        else
        {
            dialog.find("div.bxmodAuthRestoreSendPhone").show();
        }
        
        BxmodAuth.MoveTo( dialog.find("div.bxmodAuthRestoreSend") );
    },
    // �������� ������� � ������� � ����� ������������� �����������
    ToConfirmForm: function ( success )
    {
        BxmodAuth.ShowDialog( $(".bxmodAuthDialog:first") );
        if ( success == "Y" )
        {
            BxmodAuth.ToSuccessRegister( $("div.bxmodAuthDialog:first") );
        }
        else
        {
            BxmodAuth.ToAllError( $("div.bxmodAuthDialog:first") );
        }
    },
    // ����������� � ������������ �����
    MoveTo: function ( el )
    {
        var dialog = el.closest("div.bxmodAuthDialog");
        var container = dialog.find("div.bxmodAuthForms");
        var allForms = dialog.find("div.bxmodAuthForms>div, div.bxmodAuthForms>form");
        
        dialog.find("div.bxmodAuthCaptchaImg a").hide();
        
        if ( el.hasClass("taActive") )
        {
            container.stop().animate({
                height: el.height()
            }, 500);
        }
        else
        {
            allForms.not(".taActive").hide();
            allForms.removeClass("taActive");
            
            el.show().addClass("taActive");
            
            container.stop().animate({
                marginLeft: (el.offset().left - container.offset().left) * -1,
                height: el.height()
            }, 500);
        }
    },
    // ������ � �������� ��������
    SetLoading: function ( el )
    {
        if ( !el.hasClass("taLoading") )
        {
            el.html( el.val() ).addClass("taLoading");
            return true;
        }
        return false;
    },
    // �������� ����� �������� ������
    ReSetLoading: function ( el )
    {
        el.html(el.attr("title")).removeClass("taLoading");
    },
    // ������ ������������ ��������
    ReloadTimer: function ( el )
    {
        var timer = $(el);
        var sec = parseInt( timer.html() );

        if ( sec > 0 )
        {
            sec = sec - 1;
            timer.html( sec );
        }
        else
        {
            BxmodAuth.SuccessClose( timer.closest("div.bxmodAuthDialog") );
            clearTimeout( document.BxmodAuthRT );
        }
    },
    // �������� ������� / ������������ ��������
    SuccessClose: function ( dialog )
    {
        document.location.reload();
    }
}

function InitEvent() {
    // ������� � ����� ��������������
    $("div.bxmodAuthDialog a.bxmodAuthToRestore").click(function(){
        return BxmodAuth.ToRestore($(this));
    });
    
    // ������� � ����� �����������/�����������
    $("div.bxmodAuthDialog a.bxmodAuthToLogin").click(function(){
        return BxmodAuth.ToLogin($(this));
    });

    // ������� � ����� �����������/�����������
    $("div.bxmodAuthDialog .bxmodRegister").click(function(){
        return BxmodAuth.ToRegister($(this));
    });
    
    // �����������/�����������
    $("div.bxmodAuthDialog button.bxmodAuthLoginButton").click(function(){
        return BxmodAuth.DoLogin($(this));
    });
    $("div.bxmodAuthDialog form.bxmodAuthLogin input").keypress(function(e){
        if ( e.keyCode==13 ) return BxmodAuth.DoLogin($(this));
    });
    
    // ��������������
    $("div.bxmodAuthDialog button.bxmodAuthRestoreButton").click(function(){
        return BxmodAuth.DoRestore($(this));
    });
    $("div.bxmodAuthDialog form.bxmodAuthRestore input").keypress(function(e){
        if ( e.keyCode==13 ) return BxmodAuth.DoRestore($(this));
    });
    
    // �������������
    $("div.bxmodAuthDialog button.bxmodAuthConfirmButton").click(function(){
        return BxmodAuth.DoConfirm($(this));
    });
    $("div.bxmodAuthDialog form.bxmodAuthConfirm input").keypress(function(e){
        if ( e.keyCode==13 ) return BxmodAuth.DoConfirm($(this));
    });
    
    // ������� ��������� ������
    $("div.bxmodAuthDialog button.bxmodAuthSetPassButton").click(function(){
        return BxmodAuth.DoSetPass($(this));
    });
    $("div.bxmodAuthDialog form.bxmodAuthSetPass input").keypress(function(e){
        if ( e.keyCode==13 ) return BxmodAuth.DoSetPass($(this));
    });
    
    // �������� ������� �����������
   /* $(".bxmodAuthShowLink").click(function(){
        BxmodAuth.ShowDialog( $(this).prev() );
    });*/
    
    // ������� ������ ���������� ������
    $("div.bxmodAuthCaptchaBlock a").click(function(){
        BxmodAuth.ReloadCaptcha( $(this).closest("div.bxmodAuthCaptchaBlock") );
    });
    
    // �������� ����� �������������� ������
    if ( $("#bxmodAuthShowRestore").length )
    {
        BxmodAuth.ToRestoreForm( $("#bxmodAuthShowRestore").val() );
    }
    
    // �������� ����� ������������� �����������
    if ( $("#bxmodAuthShowConfirm").length )
    {
        BxmodAuth.ToConfirmForm( $("#bxmodAuthShowConfirm").val() );
    }
    
    // �������� ������� ����� �������� �����������, �����������, ��������������
    $("div.bxmodAuthDialog p.bxmodAuthMess a.taSuccess").click(function(){
        BxmodAuth.SuccessClose( $(this).closest("div.bxmodAuthDialog") );
        return false;
    });
    
    // �������� ������� ����������� ��� ������ �� "�������"
    $("div.bxmodAuthDialog a.bxmodAuthDialogClose").click(function(){
        var dialog = $(this).closest("div.bxmodAuthDialog");
        dialog.hide();
        dialog.prev().hide();
        return false;
    });
    
    // �������� ������� ����������� ��� ������ �� ����������
    $("div.bxmodAuthDialogOver").click(function(){
        $(this).hide();
        $(this).next().hide();
        return false;
    });
}

$(document).ready(
    function()
    {
        $('body').on(
            'click',
            '.bxmodAuthRegistrationButton',
            function()
            {
                $.post(
                    '/ajax/auth/?bxmodUserRegister=Y',
                    {
                        bxmodRegisterName: $('body').find('form.bxmodAuthRegister').find('input[name="bxmodAuthName"]').val(),
                        bxmodRegisterEmail: $('body').find('form.bxmodAuthRegister').find('input[name="bxmodAuthEmail"]').val(),
                        bxmodRegisterPass: $('body').find('form.bxmodAuthRegister').find('input[name="bxmodAuthPass"]').val(),
                        bxmodRegisterCaptcha: $('body').find('form.bxmodAuthRegister').find('input[name="bxmodRegisterCaptcha"]').val()
                    },
                    function(response)
                    {
                        console.log(response)

                        if(response.success === false)
                        {

                            let fieldsBlock = $('body').find('form.bxmodAuthRegister');
                            let errorsBlock = fieldsBlock.find('.popup-register-errors');

                            errorsBlock.find('> div').remove();
                            fieldsBlock.find('input.input-error').removeClass('input-error');

                            if(response.errors !== undefined && response.errors.length > 0)
                            {
                                $.each(
                                    response.errors,
                                    function(i, error)
                                    {

                                        if(error['field'] !== undefined)
                                        {
                                            $('body').find('input[name="' + error['field'] + '"]').addClass('input-error')
                                        }


                                        errorsBlock.append(
                                            $('<div />')
                                                .html(error['message'])
                                        )
                                    }
                                )
                            }

                            $('body').find('.bxmodAuthForms').css('height', 'auto');
                        }
                        else
                        {
                            document.location.reload();
                        }
                    },
                    'json'
                )
            }
        );
    }
)
/* End */
;; /* /local/templates/ursus/components/bitrix/sale.location.selector.search/geo/script.js?159846321811877*/
; /* /local/templates/ursus/components/bxmod/auth.dialog/zend-ursus/script.js?165236740325474*/
