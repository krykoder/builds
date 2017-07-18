import $ from 'jquery';
import 'bootstrap/less/bootstrap.less';
import 'font-awesome/css/font-awesome.css';
import filesize from 'filesize';
import moment from 'moment';

function init() {

        const bucket = "builds.etcdevteam.com";
        // Whitelist prefixes (projects), to exclude any other possibly
        // sensitive data or irrelevant site data.
        const whitelistPrefixes = [
                "go-ethereum",
                "emerald-wallet"
        ];
        const projects = {
                "geth": {
                        name: "Geth Classic",
                        baseEndpoint: "go-ethereum/",
                        prefixes: [],
                        files: []
                },
                "emeraldWallet": {
                        name: "Emerald Wallet",
                        baseEndpoint: "emerald-wallet/",
                        prefixes: [],
                        files: []
                }
        };
        const gcpRequestSettings = {
                "async": true,
                "crossDomain": true,
                "url": "https://www.googleapis.com/storage/v1/b/builds.etcdevteam.com/o",
                "method": "GET",
                "headers": {},
                "data": {
                        delimiter: "/",
                        prefix: "",
                        maxResults: 100
                }
        };

        // DOM elements
        let $base = $('#build-items table tbody');
        let $breadcrumbs = $("#project-breadcrumbs");
        let $selectEmeraldWallet = $("#select-emerald-wallet");
        let $selectGeth = $("#select-geth");

        function setProjectEndpoint(prefix) {
                var s = gcpRequestSettings;
                s["data"]["prefix"] = prefix;
                return s;
        }

        function getBaseEndpoint(project) {
                console.log("getting recursive files for project", project);
                if (project.files.length > 0) {
                        return renderProjectFiles();
                }
                let allfiles = [];
                function getArbitraryEndpoints(prefixes) {
                        console.log("getting arby prefixes", prefixes);
                        let defer = $.Deferred();
                        let defers = [];
                        for (var i = 0; i < prefixes.length; i++) {
                                defers.push($.ajax(setProjectEndpoint(prefixes[i])));
                        }
                        console.log("defers", defers);
                        $.when(...defers).done(function(...resArray) {
                                console.log("all whens done", resArray);
                                defer.resolve(resArray);
                        }).fail(function(errs) {
                                console.log(errs);
                                defer.reject(errs);
                        });
                        return defer.promise();
                }

                function gotEndpoints(resArr) {
                        if (resArr[0].constructor !== Array) {
                                resArr = [resArr];
                        }
                        console.log("resArr", resArr);
                        let moarPrefixes = [];
                        for (var j = 0; j < resArr.length; j++) {
                                // 0: {kind: "storage#objects", prefixes: Array(1)}1: "success"2: {readyState: 4, getResponseHeader: ƒ, getAllResponseHeaders: ƒ, setRequestHeader: ƒ, overrideMimeType: ƒ, …}length: 3__proto__: Array(0)
                                let res = resArr[j];
                                if (res[1] !== "success") {
                                        console.log(res[1]);
                                        return;
                                }
                                let response = res[0];
                                console.log("prefixes", response.prefixes, "items", response.items);
                                if (typeof response.items !== "undefined") {
                                        let files = response.items.filter((item) => {
                                                let isNested = item.name.split("/").length >= 2;
                                                let isDir = item.name.endsWith("/");
                                                return isNested && !isDir;
                                        });
                                        allfiles = allfiles.concat(files);
                                }

                                if (typeof response.prefixes !== "undefined" && response.prefixes.length > 0) {
                                        console.log("got some more prefixes", response.prefixes);
                                        let prefixes = response.prefixes.filter((prefix) => {
                                                let basename = prefix.split("/")[0];
                                                let pos = whitelistPrefixes.indexOf(basename);
                                                return pos >= 0;
                                        });
                                        moarPrefixes = prefixes;
                                }
                        }
                        if (moarPrefixes.length > 0) {
                                console.log("getting more prefixes", moarPrefixes);
                                getArbitraryEndpoints(moarPrefixes).then(gotEndpoints);
                        } else {
                                console.log("done gotting endpoints");
                                project.files = allfiles.sort((a, b) =>
                                        moment(b.timeCreated) - moment(a.timeCreated)
                                );
                                renderProjectFiles();
                        }
                }
                function renderProjectFiles() {
                        console.log("project.files", project.files);
                        $("#current-project-header").html(`${project.name} <small>Latest Artifacts</small>`);
                        renderItems(project.files);
                }

                // Kickoff.
                getArbitraryEndpoints([project.baseEndpoint])
                        .then(gotEndpoints)
                        .fail(function(e) {
                                console.log(e);
                        });
        }

        $selectEmeraldWallet.on("click", function(el) {
                getBaseEndpoint(projects.emeraldWallet);
        });
        $selectGeth.on("click", function(el) {
                getBaseEndpoint(projects.geth);
        });
        function renderItems(files) {
                if (typeof files === "undefined") { return; }
                $base.html("");
                files.map((item) => {
                        let name = item.name.substr(item.name.lastIndexOf('/') + 1);
                        let link = `/${item.name}`;
                        let nameRow = `<td><a href="${link}">${name}</a></td>`;
                        let size = filesize(item.size);
                        let sizeRow = `<td>${size}</td>`;
                        let time = moment(item.timeCreated);
                        let timeRow = `<td>${time.format('lll')}</td>`;
                        let row = `<tr>${sizeRow}${nameRow}${timeRow}</tr>`;
                        $base.append(row)
                });
        }
        function renderPrefixes(prefixes) {
                if (typeof prefixes === "undefined") { return; }
                // Clear out breadcrumbs.
                $breadcrumbs.html("");

                prefixes.map((prefix) => {
                        let a = `<p>${prefix}</p>`;
                        let $a = $(a);
                        $a.on('click', function (el) {
                                getEndpoint(prefix);
                        });
                        $breadcrumbs.append($a)
                });
        }

        // function getBaseDirsForProject(project) {
        //         $.ajax(setProjectEndpoint(project + "/")).done(function(res) {
        //                 console.log(response.prefixes);
        //                 // Filter only whitelisted prefixes, eg.
        //                 //   go-ethereum
        //                 //   emerald-wallet
        //                 let dirs = response.prefixes;
        //                 return dirs;
        //         });
        // }

        // function setBreadcrumbs(projectPath) {
        //         var projectCrumbs = projectPath.split("/");
        //         projectCrumbs.map((c) => {
        //                 let s = `<a href="">${c}</a>`;
        //         })
        // }

        getBaseEndpoint(projects.emeraldWallet);

        // function showLatest(projectPath) {
        //         $.ajax(setProjectEndpoint("emerald-wallet/preview")).done(function(response) {
        //                 console.log(response.items);
        //                 let files = response.items.filter((item) => !item.name.endsWith('/'));
        //                 files = files.sort((a, b) =>
        //                         moment(b.timeCreated) - moment(a.timeCreated)
        //                 );
        //                 });
        // }
        //
        // showLatest();
}

$(document).ready(init);
