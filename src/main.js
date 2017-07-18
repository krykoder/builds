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
        const projectNames = {
                "go-ethereum/v3.5.x/": "Geth Classic",
                "emerald-wallet/preview/": "Emerald Wallet"
        };
        const settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://www.googleapis.com/storage/v1/b/builds.etcdevteam.com/o",
                "method": "GET",
                "headers": {},
                "data": {
                        delimiter: "/",
                        prefix: "emerald-wallet/preview/", // /preview/
                        maxResults: 100
                }
        };

        // DOM elements
        let $base = $('#build-items table tbody');
        let $breadcrumbs = $("#project-breadcrumbs");
        let $selectEmeraldWallet = $("#select-emerald-wallet");
        let $selectGeth = $("#select-geth");

        function setProjectEndpoint(prefix) {
                if (typeof prefix !== "string") {
                        prefix = prefix.join("/");
                }
                var s = settings;
                s["data"]["prefix"] = prefix;
                return s;
        }

        function splitObjectName(objectName) {
                return objectName.split("/");
        }

        function objectProjectName(objectName) {
                return splitObjectName(objectName)[0];
        }

        function objectBaseName(objectName) {
                return splitObjectName(objectName)[1];
        }

        function objectItemName(objectName) {
                return splitObjectName(objectName)[2];
        }

        function selectProject(name) {

        }

        function collectPrefixes() {

        }

        function getEndpoint(object) {
                return $.ajax(setProjectEndpoint(object)).done(function(response) {
                        console.log("prefixes", response.prefixes, "items", response.items);

                        let files = [];
                        if (typeof response.items !== "undefined") {
                                files = response.items.filter((item) => {
                                        let isNested = item.name.split("/").length >= 2;
                                        let isDir = item.name.endsWith("/");
                                        return isNested && !isDir;
                                });
                                files = files.sort((a, b) =>
                                        moment(b.timeCreated) - moment(a.timeCreated)
                                );
                                renderItems(files);
                        }

                        let prefixes = [];
                        if (typeof response.prefixes !== "undefined") {
                                prefixes = response.prefixes.filter((prefix) => {
                                        let basename = prefix.split("/")[0];
                                        let pos = whitelistPrefixes.indexOf(basename);
                                        return pos >= 0;
                                });
                        }
                        $("#current-project-header").html(`${projectNames[object]} <small>Latest Artifacts</small>`);
                        // renderPrefixes(prefixes);
                });
        }
        $selectEmeraldWallet.on("click", function(el) {
                getEndpoint("emerald-wallet/preview/");
        });
        $selectGeth.on("click", function(el) {
                getEndpoint("go-ethereum/v3.5.x/");
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

        getEndpoint("emerald-wallet/preview/");

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
