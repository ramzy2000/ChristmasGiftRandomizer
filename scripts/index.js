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

        namesWithFlags = [
            [], // name entry
            [] // name flag
        ];

        namesWithFlagsCount = 0;

        // look though list and get array that holds all names with flags and store how many are there.
        // random generate names for the names that have flags first. that way they don't run out of options at the end.
        // then random generate the rest.

        randomNameData = [
            [],
            []
        ];

        namesAlreadyMatched = new Set();

        namesWithNoFlag = [];

        namesWithNoFlagCount = 0;

        finalIndex = 0;

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

            let regen = true;
            while (regen) {
                regen = false;
                // stores the [nameEntry][nameFlag] loaded form the form.
                this.nameData = [
                    [],
                    []
                ];

                this.namesWithFlags = [
                    [], // name entry
                    [] // name flag
                ];

                this.namesWithFlagsCount = 0;

                // stores the [name][nameMatch] after the process is complete
                this.randomNameData = [
                    [],
                    []
                ];

                // holds all names already 
                this.namesAlreadyMatched = new Set();

                this.namesWithNoFlag = [];

                this.namesWithNoFlagCount = 0;

                this.finalIndex = 0;

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


                // check if all of the name entry text boxes are empty
                // if so do not process the names and send a alert to user saying please
                // make sure to fill in all name entry fields.

                // load all names that have a flag into an array with there flags and process them first
                for (let i = 0; i < this.numberOfPart; i++) {
                    if (this.nameData[1][i] !== "") {
                        this.namesWithFlags[0][this.namesWithFlagsCount] = this.nameData[0][i];
                        this.namesWithFlags[1][this.namesWithFlagsCount] = this.nameData[1][i];
                        this.namesWithFlagsCount++;
                    }
                }

                // load all names that don't have a flag
                for (let i = 0; i < this.numberOfPart; i++) {
                    if (this.nameData[1][i] === "") {
                        this.namesWithNoFlag[this.namesWithNoFlagCount] = this.nameData[0][i];
                        this.namesWithNoFlagCount++;
                    }
                }

                // process the names with flags against all of the names first
                for (let i = 0; i < this.namesWithFlagsCount; i++) {
                    let currName = this.namesWithFlags[0][i]; // current entry name at the current index
                    let currFlag = this.namesWithFlags[1][i]; // current flag name at the current index
                    let randomNameFinal = ""; // will store the final resulting name that was randomly selected

                    while (!regen) {
                        let randomNum = randomIntFromInterval(0, this.numberOfPart - 1); // generate the index
                        let randomName = this.nameData[0][randomNum];

                        if (currName == randomName || currFlag === randomName || this.namesAlreadyMatched.has(randomName)) {
                            continue;
                        } else {
                            randomNameFinal = this.nameData[0][randomNum];
                            break;
                        }
                    }

                    this.namesAlreadyMatched.add(randomNameFinal); // add the matched name to the set
                    this.randomNameData[0][this.finalIndex] = currName; // store the entry name
                    this.randomNameData[1][this.finalIndex] = randomNameFinal; // store the matched name
                    this.finalIndex++;
                }

                // then process the names without flags
                for (let i = 0; i < this.namesWithNoFlagCount; i++) {
                    let currName = this.namesWithNoFlag[i]; // current entry name at the current index
                    let randomNameFinal = ""; // will store the final resulting name that was randomly selected

                    while (!regen) {
                        let randomNum = randomIntFromInterval(0, this.numberOfPart - 1); // generate the index
                        let randomName = this.nameData[0][randomNum];

                        if (currName == randomName || this.namesAlreadyMatched.has(randomName)) {
                            if (this.namesAlreadyMatched.size === this.numberOfPart - 1) {
                                regen = true;
                                break;
                            }
                            continue;
                        } else {
                            randomNameFinal = this.nameData[0][randomNum];
                            break;
                        }
                    }

                    this.namesAlreadyMatched.add(randomNameFinal); // add the matched name to the set
                    this.randomNameData[0][this.finalIndex] = currName; // store the entry name
                    this.randomNameData[1][this.finalIndex] = randomNameFinal; // store the matched name
                    this.finalIndex++;
                }

                if (!regen) {
                    // print out results
                    for (let i = 0; i < this.finalIndex; i++) {
                        console.log(this.randomNameData[0][i] + " " + this.randomNameData[1][i]); // iterate through the arrays
                    }
                }
            }
        }
    };


    let app = new App();

    // runs when the user submits the landing page
    $('#participants-submit').on("click", function () {
        app.processLandingPage();
    });
});