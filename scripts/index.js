$(function () {

    function randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    class App {
        numberOfPart = 0;

        nameData = [
            [],
            []
        ];

        randomNameData = [
            [],
            []
        ]

        namesAlreadyMatched

        App() {
            $("#main-content").hide(); // hide the other usable div
        }

        processLandingPage() {
            this.numberOfPart = $('#participants').val();
            if (this.numberOfPart == "") {
                this.logLandingPageWarningMessage("Please enter the number of participants");
            } else if (this.numberOfPart % 2 != 0) {
                this.logLandingPageWarningMessage("Please enter an even number of participants");
            } else {
                this.processMainContent(this.numberOfPart);
            }
        }

        logLandingPageWarningMessage(message) {
            $("#warning-box").show();
            $("#warning-message").text(message);
        }

        processMainContent() {
            // stop displaying landing page div
            $("#landing-page").hide();

            // generate the next the next div with text boxes
            $("#main-content").show();

            // generate the input tags with uniq names to identify them form eachother
            let name0 = "name0:";
            let name1 = "name1:";
            let temp0 = "";
            let temp1 = "";
            $("#name-entry-form").append(`<table class="center" style="margin: auto;" id="name-table">`);
            for (let i = 0; i < this.numberOfPart; i++) {
                temp0 = name0 + i;
                temp1 = name1 + i;

                //class="m-2"

                let tempStr0 = `<td><input id="${temp0}" name="${temp0}" style="font-size: 20pt;" value="" type="text"></td>`;
                let tempStr1 = `<td><input id="${temp1}" name="${temp1}" style="font-size: 20pt;" value="" type="text"></td>`;

                let tempStrFinal = "<tr>" + tempStr0 + tempStr1 + "</tr>";

                $("#name-table").append(tempStrFinal);
            }

            $("#name-entry-form").append(`</table>`);

            $("#name-entry-form").append(`<input id="name-entry-submit" type="button" value="Submit">`);

            $("#name-entry-submit").on("click", function () {
                app.submitMainContent();
            });
        }

        submitMainContent() {
            // after clicking submit button on the main-content
            // load the name0 and name1 values into a multi dimensional array [name, flagName]

            for (let i = 0; i < this.numberOfPart; i++) {
                // get the name and flagName input tags values at the current index and load into array
                let temp0 = "name0:";
                temp0 = temp0 + i;
                //temp0 = "#" + temp0;
                let name = document.getElementById(temp0).value;

                let temp1 = "name1:";
                temp1 = temp1 + i;
                //temp1 = "#" + temp1;
                let flagName = document.getElementById(temp1).value;

                this.nameData[0][i] = name;
                this.nameData[1][i] = flagName;
            }

            // loop through each name with its flag
            for (let i = 0; i < this.numberOfPart; i++) {
                //console.log(this.nameData[0][i] + " " + this.nameData[1][i]); // iterate through the arrays

                // generate a random number for this name entry from 0 to this.numberOfPart-1

                // loop through all names and check the matching index of the random index
                // if the name at the index is equal to the name matching regenerate the number

                while (true) {
                    let randomNum = randomIntFromInterval(0, this.numberOfPart - 1); // generate the random numberOfChecks

                    // check if the random number generated name is not matching your name or the flag nameData

                    if (nameData[0][i] == nameData[0][randomNum]) {
                        continue;
                    } else if (nameData[1][i] == nameData[0][randomNum]) {
                        continue;
                    } else {
                        break;
                    }
                }

                randomNameData[0][i] = nameData[0][i]; // [Grifter, recipient]
                randomNameData[1][i] = nameData[0][randomNum];
            }

            // print out results
            for (let i = 0; i < this.numberOfPart; i++) {
                console.log(this.randomNameData[0][i] + " " + this.randomNameData[1][i]); // iterate through the arrays
            }
        }
    };


    let app = new App();

    // runs when the user submits the landing page
    $('#participants-submit').on("click", function () {
        app.processLandingPage();
    });
});