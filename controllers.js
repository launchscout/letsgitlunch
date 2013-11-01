angular.module('demo', ["googleApi", "ngResource", "firebase", "ngRoute", "ui.bootstrap"])

    .config(function(googleLoginProvider, $parseProvider) {
        googleLoginProvider.configure({
            clientId: '239511214798.apps.googleusercontent.com',
            scopes: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/calendar"]
        });
        $parseProvider.unwrapPromises(true);
    })
    .controller('DemoCtrl', function ($scope, $http, googleLogin, googleCalendar, $resource, angularFireAuth) {

        $scope.sharedCalendarId = "gaslight.co_4ctvekpc8actkvfsuthg17lcn0@group.calendar.google.com";
        var ref = new Firebase("https://letsgitlunch.firebaseio.com/");
        var githubMembers = $resource('https://api.github.com/orgs/:org/members');
        var githubOrgs = $resource('https://api.github.com/users/:user/orgs');

        $scope.login = function () {
            googleLogin.login().then(function() {}, function() { console.error("failed login")});
        };

        angularFireAuth.initialize(ref, {scope: $scope, name: "githubUser"});
        $scope.loginToGithub = function() {
            angularFireAuth.login("github");
        }

        $scope.$on("angularFireAuth:login", function() {
            $scope.organizations = githubOrgs.query({user: $scope.githubUser.login});
            $scope.loggedIntoGithub = true;
        });

        $scope.loadMembers = function() {
            $scope.members = githubMembers.query({org: this.selectedOrganization.login});
        }

        $scope.$on("google:authenticated", function(auth) {
            $scope.loggedIntoGoogle = true;
        });

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
                $scope.chosenMember = member;
                var event = {
                    attendees: [{email: member.email}, {email: $scope.githubUser.email}],
                    summary: "Random Gaslight Lunch",
                    location: "Somewheres yummy",
                    description: member.name + " and " + $scope.githubUser.name,
                    start: { dateTime: lunchStart.toDate() },
                    end: { dateTime: lunchEnd.toDate() }
                };
                googleCalendar.createEvent({
                    calendarId: self.selectedCalendar.id,
                    sendNotifications: true,
                    resource: event
                }).then(function(event) {
                    $scope.newEvent = event;
                }, function(error) {
                    $scope.eventCreationError = error;
                });

            });
        }
    });
