var BG = chrome.extension.getBackgroundPage();

/**
 * Bind tooltips
 */
jQuery(document).ready(function($) {
    $('.container').tooltip({
        selector: "i[data-type='tooltip']"
    });

    //Popover
    $('.container').popover({
        selector: ".help[data-type='popover']",
        trigger: "hover",
        placement: "top"
    });
});

/**
 * Open Issue Author's Redmine page
 * 
 * @param {int} userId
 * @returns {undefined}
 */
function openAuthorPage(userId) {
    chrome.tabs.create({url: BG.getConfig().getHost()+"users/"+userId});
}

/**
 * Main controller
 * 
 * @param {Object} $scope
 * @returns {void}
 */
function Main($scope) {
    $scope.options = BG.getConfig();
    $scope.xhrError = false;
    $scope.projects = BG.getProjects().all();
    
    
    $scope.xhrErrorHandler = function(request, sender, sendResponse) {
        if (request.action && request.action == "xhrError" && request.params) {
            $scope.$apply(function(sc) {
                sc.xhrError = true;
            });
        }
    };
    $scope.onMessageHandler = function(request, sender, sendResponse) {
        if (request.action && request.action == "projectsLoaded" && request.projects) {
            $scope.$apply(function(sc) {
                sc.projects = request.projects;
            });
        }
    };
    
    /**
     * On projects updated
     */
    $scope.updateProjects = function() {
        BG.getProjects().all(true);
    };

    /**
     * On project filter
     * 
     * @param {Event} event
     */
    $scope.projectChecked = function(event) {
        console.log(event);
    };

    /**
     * Store project filtering settings
     */
    $scope.storeProjects = function() {
        //Clear list
        BG.getConfig().getProjectsSettings().list = [];
        angular.forEach($scope.projects, function(value, key) {
            if (value.used) {
                BG.getConfig().getProjectsSettings().list.push(value.id);
            }
        });
        BG.getConfig().store(BG.getConfig().getProfile());
        BG.getProjects().store();
        BG.getIssues().clearIssues();
        jQuery('#projectFilters').modal('toggle');
    };
    chrome.extension.onMessage.addListener($scope.xhrErrorHandler);
    chrome.extension.onMessage.addListener($scope.onMessageHandler);
}

/**
 * Options screen controller
 * 
 * @param {Object} $scope
 * @param {Object} $timeout
 * @returns {void}
 */
function Options($scope, $timeout) {
    $scope.options = BG.getConfig();
    $scope.success = false;
    $scope.useHttpAuth = BG.getConfig().getProfile().useHttpAuth;
    /**
     * Hide success message
     */
    $scope.hideSuccess = function() {
        $scope.success = false;
    };
    /**
     * Save new options
     */
    $scope.storeOptions = function() {
        BG.getConfig().store(BG.getConfig().getProfile());
        BG.clearItems();
        $scope.success = true;
        $timeout($scope.hideSuccess, 5000);
    };

    /**
     * Save notifications options
     */
    $scope.storeNotifications = function() {
        BG.getConfig().getProfile().notifications.show = document.querySelector(".notification_show:checked").value;
        BG.getConfig().store(BG.getConfig().getProfile());
        $scope.options = BG.getConfig();
        $scope.success = true;
        $timeout($scope.hideSuccess, 5000);
    };

    /**
     * Store Misc tab settings
     */
    $scope.storeMisc = function() {
        BG.getConfig().store(BG.getConfig().getProfile());
    };
    
    /**
     * Check if http auth available
     * 
     * @param {Event} event
     */
    $scope.checkHttpAuth = function(event) {
        $scope.useHttpAuth = $(event.source).is(":checked");
    };
}

/**
 * Main screen controller
 * 
 * @param {Scope} $scope
 * @returns {undefined}
 */
function Home($scope) {
    $scope.options = BG.getConfig();
    $scope.availStatuses = BG.getIssues().getStatuses();
    $scope.issues = [];
    $scope.order = "updated_on";
    $scope.reverse = true;
    $scope.isLoading = false;
    
    $scope.pageSize = 25;
    $scope.page = 0;
    
    //Vars for detailed info
    $scope.issue = {};
    $scope.project = {};

    /**
     * On new file selected for upload
     */
    $scope.fileSubmitted = function(file) {
        console.log(file);
    };
    
    /**
     * Store table options
     */
    $scope.storeTableOptions = function() {
        BG.getConfig().store(BG.getConfig().getProfile());
        $('#tableOptions').modal('toggle');
    };
    /**
     * Get number of pages for list of issues
     * 
     * @returns {int}
     */
    $scope.numberOfPages=function(){
        return Math.ceil($scope.issues.length/$scope.pageSize);                
    };
    
    /**
     * Update issues on the screen.
     */
    $scope.updateIssues = function() {
        $scope.issues = [];
        for(var key in BG.getIssues().issues) {
            $scope.issues.push(BG.getIssues().issues[key]);
        }
    };
    //Run update issues action
    $scope.updateIssues();
    
    /**
     * Mark issue as read 
     * 
     * @param {Object} issue
     * @returns {undefined}
     */
    $scope.markRead = function(issue) {
        if (issue.read) {
            return;
        }
        BG.getIssues().markAsRead(issue.id);
        issue.read = true;
    };

    /**
     * Mark issue unread
     *
     * @param {Object} issue
     */
    $scope.markUnRead = function(issue) {
        if (!issue.read) {
            return;
        }
        BG.getIssues().markAsUnRead(issue.id);
        issue.read = false;
    };
    
    /**
     * Mark all visible issues as read
     * 
     * @returns {undefined}
     */
    $scope.markAllRead = function() {
        BG.getIssues().markAllAsRead();
        $scope.updateIssues();
    };
    
    /**
     * Reload issues
     * 
     * @returns {undefined}
     */
    $scope.reload = function() {
        $scope.isLoading = true;
        BG.getIssues().load();
    };
    
    /**
     * Open new tab with issue details
     * 
     * @param {Object} issue
     */
    $scope.openWebPage = function(issue) {
        chrome.tabs.create({url: BG.getConfig().getHost()+"issues/"+issue.id});
    };
    
    /**
     * Open authors Redmine page
     * @param {int} userId
     * @returns {undefined}
     */
    $scope.openAuthorPage = function(userId) {
        openAuthorPage(userId);
    };
    
    $('#issueDetails').modal({
        show: false
    });
    /**
     * Show issue details
     * 
     * @param {Object} issue
     */
    $scope.showDetails = function(issue) {
        BG.getIssues().get(issue, !issue.read);
        $scope.markRead(issue); //mark this issue as read
        $scope.issue = issue;
        $scope.project = BG.getProjects().get($scope.issue.project.id);
        console.log(issue);
        console.log($scope.project);
        $('#issueDetails').modal('toggle');
    };

    /**
     * Change the issue status and update it in Redmine
     * 
     * @param {String} value new issue status
     * @returns {void}
     */
    $scope.stausOk = function(value) {
        $scope.issue.detailsLoaded = false;
        BG.getIssues().update($scope.issue.id, {'status_id': parseInt(value)});
    };

    /**
     * Update tracker data into issue
     * 
     * @param {int} value
     */
    $scope.trackOk = function(value) {
        $scope.issue.detailsLoaded = false;
        BG.getIssues().update($scope.issue.id, {'tracker_id': parseInt(value)});
    };

    /**
     * Update issue done ratio
     * 
     * @param {int} value
     */
    $scope.doneOk = function(value) {
        $scope.issue.detailsLoaded = false;
        BG.getIssues().update($scope.issue.id, {'done_ratio': parseInt(value)});
    };

    /**
     * Chage estimate hours
     * 
     * @param {int} value
     */
    $scope.estimatedOk = function(value) {
        console.log(value);
        $scope.issue.detailsLoaded = false;
        BG.getIssues().update($scope.issue.id, {'estimated_hours': parseInt(value)});
    };

    /**
     * Add new comment to issue
     * 
     * @param {String} comment
     */
    $scope.addComment = function(comment) {
        $scope.issue.detailsLoaded = false;
        BG.getIssues().comment($scope.issue.id, comment);
    };
    
    //Handle update issue details
    var onIssueDetails = function(request, sender, sendResponse) {
        if ($scope.issue.id == request.id) {
            //update issue
            $scope.$apply(function(sc) {
                sc.issue = request.issue;
                sc.updateIssues();
            });
            sendResponse({});
        }
    };
    
    //Handle update issues list
    var onIssuesUpdated = function(request, sender, sendResponse) {
        $scope.$apply(function(sc) {
            sc.issues = [];
            sc.isLoading = false;
            sc.updateIssues();
        });
    };
    
    //handle project updated datas
    var onProjectUpdated = function(request, sender, sendResponse) {
        if (!$scope.issue.project) {
            return;
        }
        $scope.$apply(function(sc) {
            var projId = sc.issue.project.id;
            if (projId && projId > 0 && projId == request.project.id) {
                sc.project = request.project;
            }
        });
    };

    // Handle file upload to redmine
    var onFileUploaded = function(request, sender, sendResponse) {
        console.log(request.token, request.file);
        var data = {
            'uploads': [ 
                {
                    'token': request.token,
                    'filename': request.file.name,
                    'content_type': request.file.type
                }
            ]
        };
        BG.getIssues().update($scope.issue.id, data);
    };
    
    //Global message listener
    var onMessage = function(request, sender, sendResponse) {
        if (!request.action) {
            return;
        }
        switch(request.action) {
            case "issueDetails": 
                return onIssueDetails(request, sender, sendResponse);
                break;
            case "issuesUpdated": 
                return onIssuesUpdated(request, sender, sendResponse);
                break;
            case "projectUpdated": 
                return onProjectUpdated(request, sender, sendResponse);
                break;
            case "fileUploaded": 
                return onFileUploaded(request, sender, sendResponse);
                break;
        }
    };
    
    //Add one global handler for messages from background
    chrome.extension.onMessage.addListener(onMessage);
}

/**
 * New issue controller
 * 
 * @param {Scope} $scope
 * @param {RouteParams} $routeParams
 * @returns {undefined}
 */
function NewIssue($scope) {
    //Store selected in context menu text
    var subject = BG.getSelectedText();
    //clear selected text
    BG.clearSelectedText();
    //list of projects
    $scope.projects = BG.getProjects().all();
    $scope.project = {};
    
    //User options
    $scope.options = BG.getConfig();

    $scope.isLoading = false;
    $scope.success = false;
    //List of errors
    $scope.errors = [];
    
    $scope.membersLoading = false;
    
    // Issue model
    $scope.issue = {
        subject: subject,
        project_id: 0,
        description: ""
    };

    /**
     * handle project selection
     */
    $scope.projectChanged = function() {
        if ($scope.issue.project_id > 0) {
            $scope.project = BG.getProjects().get($scope.issue.project_id);
            if (!$scope.project.membersLoaded) {
                BG.getProjects().getMembers($scope.issue.project_id);
            }
        } else {
            $scope.project = {};
        }
        //clear field depending on selected project
        if ($scope.issue.tracker_id) {
            delete $scope.issue.tracker_id;
        }
        if ($scope.issue.assigned_to_id) {
            delete $scope.issue.assigned_to_id;
        }
        console.log($scope.project);
    };

    /**
     * Submit handler
     */
    $scope.submit = function() {
        $scope.errors = []; //clear errors
        //checks
        if ($scope.issue.project_id < 1) {
            $scope.errors.push("Please select project");
        }
        //clear empty values
        if ($scope.issue.assigned_to_id == "") {
            delete $scope.issue.assigned_to_id;
        }
        //Check before submit
        if ($scope.errors.length > 0) {
            return false;
        }
        BG.getIssues().create($scope.issue);
        $scope.isLoading = true;
    };

    /**
     * On new issue created
     * 
     * @param {Object} request
     * @param {Object} sender
     * @param {Object} sendResponse
     * @returns {undefined}
     */
    var onIssueCreated = function(request, sender, sendResponse) {
        $scope.$apply(function(sc) {
            sc.isLoading = false;
            sc.success = true;
            //clear issue
            sc.issue = {
                subject: "",
                project_id: 0,
                description: ""
            };
            //clear project
            sc.project = {};
        });
    };
    /**
     * On project details updated
     * 
     * @param {Object} request
     * @param {Object} sender
     * @param {Object} sendResponse
     * @returns {undefined}
     */
    var onProjectUpdated = function(request, sender, sendResponse) {
        //check project
        if (!request.project) {
            return;
        }
        //Check current project
        if ($scope.issue.project_id != request.project.id) {
            return;
        }
        $scope.$apply(function(sc) {
            sc.project = request.project;
            console.log("Updated", sc.project);
        });
    };

    //Handle new issue creation
    var onMessage = function(request, sender, sendResponse) {
        if (!request.action && request.action != "issueCreated") {
            return;
        }
        switch(request.action) {
            case "issueCreated":
                return onIssueCreated(request, sender, sendResponse);
                break;
            case "projectUpdated":
                return onProjectUpdated(request, sender, sendResponse);
                break;
        };
    };

    //Add one global handler for messages from background
    chrome.extension.onMessage.addListener(onMessage);
}

/**
 * Controller for project template
 * @param {Object} $scope
 * @param {Object} $routeParams
 * @returns {void}
 */
function Project($scope, $routeParams) {
    $scope.id = $routeParams.id;

    //available filters
    $scope.filters = {
        'onlyMy': false
    };
    //Filters for issues list
    $scope.issueFilter = {
        'assigned_to': ""
    };
    //Load current user data
    $scope.myId = BG.getConfig().getProfile().currentUserId;

    //Load project details
    $scope.project = BG.getProjects().get($scope.id);
    //list of issues
    $scope.issues = [];

    /**
     * Bind issues to filtering
     */
    $scope.bindIssues = function() {
        $scope.issues = [];
        for(var key in $scope.project.issues) {
            $scope.issues.push($scope.project.issues[key]);
        }
    };

    //Run issues loading 
    BG.getProjects().getIssues($scope.id);
    $scope.bindIssues();
    console.log($scope.issues);

    /**
     * Show/Hide only my issues filter
     */
    $scope.onlyMy = function() {
        $scope.filters.onlyMy = !$scope.filters.onlyMy;  
        $scope.issueFilter.assigned_to = $scope.filters.onlyMy ? $scope.myId : "";
    };

    /**
     * On project details updated
     * 
     * @param {Object} request
     * @param {Object} sender
     * @param {Object} sendResponse
     * @returns {undefined}
     */
    var onProjectUpdated = function(request, sender, sendResponse) {
        //check project
        if (!request.project) {
            return;
        }
        //Check current project
        if ($scope.id != request.project.id) {
            return;
        }
        $scope.$apply(function(sc) {
            sc.project = request.project;
            sc.bindIssues();
        });
    };

    //Handle new issue creation
    var onMessage = function(request, sender, sendResponse) {
        if (!request.action && request.action != "issueCreated") {
            return;
        }
        switch(request.action) {
            case "projectUpdated":
                return onProjectUpdated(request, sender, sendResponse);
                break;
        };
    };

    //Add one global handler for messages from background
    chrome.extension.onMessage.addListener(onMessage);
}


//Options.$inject = ['$scope', '$timeout'];
//Home.$inject = ['$scope'];
//NewIssue.$inject = ['$scope'];
//Project.$inject = ['$scope', '$routeParams'];