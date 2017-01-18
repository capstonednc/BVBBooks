function token() {
    var card = {
    number: $('.card-number').val(),
    cvc: $('.card-cvc').val(),
    exp_month: $('.card-exp-month').val(),
    exp_year: $('.card-exp-year').val(),
    expiry: ($('.card-exp-month').val()) + " , " + ($('.card-exp-year').val()),
    brand: Schema.cardType($('.card-number').val()),
    billing: {
        name: $('.billing-name').val(),
        address1: $('.billing-address1').val(),
        phone: $('.billing-phone').val(),
        city: $('.billing-city').val(),
        state: $('.billing-state').val(),
        zip: $('.billing-zip').val(),
        country: $('.billing-country').val()
        }    
    };
    console.log(Schema.validateCardNumber(card.number));
    console.log(Schema.validateExpiry(card.exp_month, card.exp_year));
    console.log(Schema.validateCVC(card.cvc));
    console.log(Schema.cardType(card.number));
    console.log(card);
    Schema.createToken(card, function(status, response) {
        var $form = $('#checkout-form');

        if (response.error) {
            // Show error
            $form.find('#payment-error').text(response.error.message);
        } else {
            // Append token to the checkout form and submit
            $form.append($('<input type="hidden" name="token"/>').val(response.token));
            $form.append($('<input type="hidden" name="last4"/>').val(response.last4));
            $form.append($('<input type="hidden" name="brand"/>').val(response.brand));
            $form.append($('<input type="hidden" name="name"/>').val(response.billing.name));
            $form.append($('<input type="hidden" name="address1"/>').val(response.billing.address1));
            $form.append($('<input type="hidden" name="phone"/>').val(response.billing.phone));
            $form.append($('<input type="hidden" name="city"/>').val(response.billing.city));
            $form.append($('<input type="hidden" name="state"/>').val(response.billing.state));
            $form.append($('<input type="hidden" name="zip"/>').val(response.billing.zip));
            $form.append($('<input type="hidden" name="country"/>').val(response.billing.country));
            $form.submit();
        }
    });
}

function shownew() {
 $('.addnew').show().css('display', 'inline-block');
 $('.nocardbutton').hide();
   }
function hideform() {
    $('.addnew').hide().css('display', 'none');
    $('.nocardbutton').show();
}

$('#samebilling').on("change", function(){
    if(this.checked){
        $(".shipping-name").val($(".shipname").val()).prop('read-only',this.checked);
        $(".shipping-address1").val($(".shipaddress1").val()).prop('read-only',this.checked);
        $(".shipping-city").val($(".shipcity").val()).prop('read-only',this.checked);
        $(".shipping-state").val($(".shipstate").val()).prop('read-only',this.checked);
        $(".shipping-zip").val($(".shipzip").val()).prop('read-only',this.checked);
        $(".shipping-country").val($(".shipcountry").val()).prop('read-only',this.checked);
    } else {
        $(".shipping-name").val("").prop('read-only',this.checked);
        $(".shipping-address1").val("").prop('read-only',this.checked);
        $(".shipping-city").val("").prop('read-only',this.checked);
        $(".shipping-state").val("").prop('read-only',this.checked);
        $(".shipping-zip").val("").prop('read-only',this.checked);
        $(".shipping-country").val("").prop('read-only',this.checked);
    }
})

$('#usedefault').on("change", function(){
    if(this.checked){
        $('.neworderaddress').show().css('display', 'inline-block');
        $(".shipping-name").val($(".shipname").val()).prop('read-only',this.checked);
        $(".shipping-address1").val($(".shipaddress1").val()).prop('read-only',this.checked);
        $(".shipping-city").val($(".shipcity").val()).prop('read-only',this.checked);
        $(".shipping-state").val($(".shipstate").val()).prop('read-only',this.checked);
        $(".shipping-zip").val($(".shipzip").val()).prop('read-only',this.checked);
        $(".shipping-country").val($(".shipcountry").val()).prop('read-only',this.checked);
    } else {
       $('.neworderaddress').show().css('display', 'inline-block');
    }
})

$('#addnewaddress').on("change", function(){
    if(this.checked){
        $('.neworderaddress').show().css('display', 'inline-block');
        $(".shipping-name").val("").prop('read-only',this.checked);
        $(".shipping-address1").val("").prop('read-only',this.checked);
        $(".shipping-city").val("").prop('read-only',this.checked);
        $(".shipping-state").val("").prop('read-only',this.checked);
        $(".shipping-zip").val("").prop('read-only',this.checked);
        $(".shipping-country").val("").prop('read-only',this.checked);
    } else {
        $('.neworderaddress').hide().css('display', 'none');
    }
})

// function sameBilling(f) {

//         if(f.samebilling.checked == true) {

//             f.billing_first_name.value = f.first_name.value;

//             f.billing_last_name.value = f.last_name.value;

//             f.billing_address_1.value = f.address_1.value;

//             f.billing_address_2.value = f.address_2.value;

//             f.billing_city.value = f.city.value;

//             f.billing_state.value = f.state.value;

//             f.billing_zipcode.value = f.zipcode.value;



//         }

//         if(f.billingtoo.checked == false) {

//             f.billing_first_name.value = '';

//             f.billing_last_name.value = '';

//             f.billing_address_1.value = '';

//             f.billing_address_2.value = '';

//             f.billing_city.value = '';

//             f.billing_state.value = '';

//             f.billing_zipcode.value = '';

//         }

//     }
