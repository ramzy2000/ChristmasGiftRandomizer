$(function() {

    $("#main-content").hide(); // hide the other usable div

    function logLandingPageWarningMessage(message) {
        $("#warning-box").show();
        $("#warning-message").text(message);
    }

    function processMainContent(numberOfPart) {
         // stop displaying landing page div
         $("#landing-page").hide();

         // generate the next the next div with text boxes
         $("#main-content").show();
         
         // generate the input tags with uniq names to identify them form eachother
         let pref = "name";
         for(let i = 0; i < numberOfPart; i++) {
            temp = pref + i;
            $("#name-entry-form").append(`<input name="${temp}" style="font-size: 20pt;" class="m-2" type="text"><input style="font-size: 20pt;" class="m-2" type="text"> </br>`);
         }
    }

    // this will validate user input and move onto
    // if the input is valid it will process the main content
    function processLandingPage() {
        let numberOfPart = $('#participants').val();
        if(numberOfPart == "") {
            logLandingPageWarningMessage("Please enter the number of participants");
        } else if(numberOfPart % 2 != 0) {
            logLandingPageWarningMessage("Please enter an even number of participants");
        } else {
            processMainContent(numberOfPart);
        }
    }

    // runs when the user submits the landing page
    $('#participants-submit').on("click", function(){
        processLandingPage();
    });
});