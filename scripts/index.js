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

        namesAlreadyMatched = new Set();

        namesWithNoFlag = new Set();

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
            // stores the [nameEntry][nameFlag] loaded form the form.
            this.nameData = [
                [],
                []
            ];
    
            // stores the [name][nameMatch] after the process is complete
            this.randomNameData = [
                [],
                []
            ]

            // holds all names already 
            this.namesAlreadyMatched = new Set();

            this.namesWithNoFlag = new Set();

            // load the nameData multidimentinal array from generated the input forms
            for (let i = 0; i < this.numberOfPart; i++) {
                let temp0 = "name0:";
                temp0 = temp0 + i;
                let name = document.getElementById(temp0).value;

                let temp1 = "name1:";
                temp1 = temp1 + i;
                let flagName = document.getElementById(temp1).value;

                this.nameData[0][i] = name;
                this.nameData[1][i] = flagName;
            }

            // load the randomNameData multidimentinal array by looping through all names entered
            // from the first index to the last randomly generate a number between the amount of available indexs. 
            // If the name is equal to the the name at the index from the random number or If the current flag name
            // is equal to the name at the index of the random number or If the current flag name is already in the name set object
            // then regenerate the number and check again if anything else store the name entered and the name matched.

            for (let i = 0; i < this.numberOfPart; i++) {
                if (this.nameData[1][i] == "") {
                    this.namesWithNoFlag.add(this.nameData[0][i]);
                }
            }

            for (let i = 0; i < this.numberOfPart; i++) {
                let currName = this.nameData[0][i]; // current entry name at the current index
                let currFlag = this.nameData[1][i]; // current flag name at the current index
                let randomNameFinal = ""; // will store the final resulting name that was randomly selected

                // keep generating the number for the current index until the critera is met
                while (true) {
                    let randomNum = randomIntFromInterval(0, this.numberOfPart - 1); // generate the random numberOfChecks
                    let randomName = this.nameData[0][randomNum]; // get the name at the index of the random number

                    if (currFlag !== "") {
                        if (currName == randomName || currFlag == randomName || this.namesAlreadyMatched.has(randomName)) {
                            continue
                        } else {
                            randomNameFinal = this.nameData[0][randomNum];
                            break;
                        }
                    } else {
                        if (currName == randomName || this.namesAlreadyMatched.has(randomName) || this.namesWithNoFlag.has(randomName)) {
                            continue
                        } else {
                            randomNameFinal = this.nameData[0][randomNum];
                            break;
                        }
                    }
                }

                this.namesAlreadyMatched.add(randomNameFinal); // add the matched name to the set
                this.randomNameData[0][i] = this.nameData[0][i]; // store the entry name
                this.randomNameData[1][i] = randomNameFinal; // store the matched name
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