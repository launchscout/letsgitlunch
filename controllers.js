angular.module('demo', ["googleApi", "ngResource", "firebase", "ngRoute", "ui.bootstrap"])

    .config(function(googleLoginProvider, $parseProvider) {
        googleLoginProvider.configure({
            clientId: '239511214798.apps.googleusercontent.com',
            scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/calendar"]
        });
        $parseProvider.unwrapPromises(true);
    })
    .controller('DemoCtrl', function ($scope, $http, googleLogin, googleCalendar, $resource, angularFireAuth) {

        var ref = new Firebase("https://propupdev.firebaseio.com/props");
        var githubMembers = $resource('https://api.github.com/orgs/:org/members');
        $scope.login = function () {
            googleLogin.login();
        };

        angularFireAuth.initialize(ref, {scope: $scope, name: "githubUser"});
        $scope.loginToGithub = function() {
            angularFireAuth.login("github");
        }

        $scope.$on("angularFireAuth:login", function() {
            $scope.members = githubMembers.query({org: "gaslight"})
        });

        $scope.loadEvents = function() {
            this.calendarItems = googleCalendar.listEvents();
        }

        $scope.$on("googleCalendar:loaded", function() {
            googleCalendar.listCalendars().then(function(cals) {
                $scope.calendars = cals;
            });
        });
        $scope.loadCalendars = function() {
            this.calendars = googleCalendar.listCalendars();
        }

        $scope.addEvent = function() {
            randomMember = _.sample(this.members);
            var self = this;
            lunchStart = moment(self.lunchDate + " " + self.lunchTime);
            lunchEnd = lunchStart.clone().add("hours", 1);
            $http.get(randomMember.url).success(function(member) {
                var event = {
                    attendees: [{email: "chris@gaslight.co"}],
                    summary: "Random Gaslight Lunch",
                    location: "Somewheres yummy",
                    start: { dateTime: lunchStart.toDate() },
                    end: { dateTime: lunchEnd.toDate() }
                };
                $scope.newEvent = googleCalendar.createEvent({
                    calendarId: self.selectedCalendar.id,
                    resource: event
                });

            });
        }
    });
