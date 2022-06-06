import URI, { parseQuery, buildQuery } from "urijs";

(function($, window, document, undefined) {
    "use strict";

    "function" !== typeof String.prototype.replaceSpecialChars &&
        (String.prototype.replaceSpecialChars = function() {
            return this.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        });

    $.fn.smartFilter = function(options) {
        const log = (msg, type) => {
            if (typeof console == "object") {
                if (type === "Aviso") {
                    console.warn(`[SmartFilter - ${type}] ${msg}`);
                }

                if (type === "Erro") {
                    console.error(`[SmartFilter - ${type}] ${msg}`);
                }
            }
        };

        const $elements = {
            self: $(this),
            multipleFilter: $(".search-multiple-navigator"),
            singleFilter: $(".search-single-navigator"),
            currentSearchUrl: {},
            groupFilters: []
        };

        const init = function() {
            let defaults = {
                    eraseCounter: true,
                    shelfClass: ".prateleira",
                    callback: function() {}
                },
                settings = $.extend({}, defaults, options);

            if (settings.eraseCounter) {
                $elements.multipleFilter.find("label").each(function() {
                    let _text = $(this).html();

                    $(this).html(handlers.removeCounter(_text));
                });
            } else {
                $elements.multipleFilter.find("label").each(function() {
                    let _text = $(this).html();

                    $(this).html(handlers.badgeCounter(_text));
                });
            }

            $elements.currentSearchUrl = handlers.getSearchUrl();

            handlers.fieldsetFormat();
            handlers.setMultipleFilter();
            handlers.loadPage();
            settings.callback.call(this);
        };

        const handlers = {
            removeCounter: text => {
                return text.replace(/\([0-9]+\)/gi, a => {
                    return "";
                });
            },
            badgeCounter: text => {
                return text.replace(/\(/gi, '<span class="badge-counter lever">').replace(/\)/gi, "</span>");
            },
            fieldsetFormat: () => {
                $elements.multipleFilter.find("fieldset").each(function() {
                    let $fieldset = $(this);
                    let $label = $fieldset.find("label");
                    let $input = $fieldset.find("input");
                    let fieldsetClass = `filter-group_${($fieldset.find("h5:first").text() || "")
                        .toLowerCase()
                        .replaceSpecialChars()
                        .replace(/\s/g, "-")}`;

                    // Hide fieldset when no filter exists and exit method
                    if ($label.length < 1) {
                        $fieldset.hide();
                        return;
                    }

                    $fieldset.addClass(fieldsetClass);

                    $input.addClass("filled-in");

                    $label.each(function(ndx) {
                        let inputValue =
                            $(this)
                                .find("input")
                                .val() || "";
                        let labelClass = `filter-item_${inputValue
                            .toLowerCase()
                            .replaceSpecialChars()
                            .replace(/\s/g, "-")}`;

                        $(this)
                            .addClass(labelClass)
                            .attr({ "data-title": inputValue, "data-index": ndx }).append('<span class="filter-item__box"/>');
                    });
                });
            },
            setMultipleFilter: () => {
                if ($elements.multipleFilter.length) {
                    $elements.self.find(".menu-navegue, h3, h4, .bt-refinar").remove();
                    $elements.singleFilter.hide();
                    $elements.multipleFilter.show().css("visibility", "visible");
                }
            },
            getSearchUrl: () => {
                let url;
                let content;
                let regexUrl;
                let regextPageCount;
                let pageCount;

                $("script:not([src])").each(function() {
                    content = $(this)[0].innerHTML;
                    regexUrl = /\/buscapagina\?.+&PageNumber=/gi;
                    regextPageCount = /pagecount_[0-9]+/gi;

                    if (content.search(/\/buscapagina\?/gi) > -1) {
                        url = regexUrl.exec(content);
                        pageCount = regextPageCount.exec(content);
                        return false;
                    }
                });

                if (typeof url !== "undefined" && typeof url[0] !== "undefined") {
                    return { url: url[0], pageCount: pageCount };
                } else {
                    log(`Não foi possível localizar a url de busca da página.\n\n[Método: getSearchUrl]`, "Aviso");
                    return "";
                }
            },
            getFilteredPage: () => {
                let currentUrl = new URI($elements.currentSearchUrl.url);
                let actualUrl = new URI(window.location.href);
                let currentQuery = parseQuery(currentUrl._parts.query);
                let queryFilter = $elements.groupFilters.length ? `&fq=${$elements.groupFilters.join("&fq=")}` : "";
                let url = "";

                $.each(currentQuery, function(index, item) {
                    if (index !== "fq" && index !== "O") {
                        delete currentQuery[index];
                    }
                });

                currentUrl._parts.path = "/busca";
                currentQuery.fq = `${currentQuery.fq}${queryFilter}`;
                currentUrl._parts.query = buildQuery(currentQuery);
                url = decodeURIComponent(URI.build(currentUrl._parts));

                let settings = {
                    async: true,
                    crossDomain: true,
                    url: url,
                    method: "GET"
                };

                $.ajax(settings).done(function(response) {
                    let contentScript;
                    let url;
                    let codePage;
                    let wrap;
                    let $content = $(response).filter((index, item) => {
                        let itemName = item.tagName;
                        let itemSrc = $(item).attr("src");

                        if (itemName === "SCRIPT" && itemSrc === undefined) {
                            return item;
                        }
                    });

                    $content.each(function() {
                        let content = $(this)[0].innerHTML;
                        let regexUrl = /\/buscapagina\?.+&PageNumber=/gi;
                        let regexCodePage = /pagecount_.\d+/gi;

                        if (content.search(/\/buscapagina\?/gi) > -1) {
                            contentScript = content;
                            url = regexUrl.exec(content);
                            codePage = regexCodePage.exec(content)[0];

                            return false;
                        }
                    });

                    if (!!contentScript) {
                        let contentSplited = contentScript.split(/\n/);
                        let part1 = contentSplited
                            .filter((item, index) => {
                                if (!!item && item) {
                                    return index >= 8 && item;
                                }
                            })
                            .join("\n");
                        let part2 = contentSplited
                            .filter((item, index) => {
                                if (!!item && item) {
                                    return index < 8 && item + "\n";
                                }
                            })
                            .join("\n");

                        wrap = `${part1}\n${part2}`;
                    } else {
                        let itemToRemove = $elements.groupFilters.pop().replace(/\//g, "%2f");

                        $elements.self
                            .find(`input[rel="fq=${itemToRemove}"]`)
                            .prop("checked", false)
                            .parent()
                            .removeClass("filter_selected");

                        handlers.groupFilters();
                        log("Não foi possível aplicar esta combinação de filtros!!", "Aviso");
                    }

                    $(".vitrine.resultItemsWrapper").html(
                        $(response)
                            .find(".vitrine.resultItemsWrapper")
                            .html()
                    );

                    var newScript = document.createElement("script");
                    var inlineScript = document.createTextNode(wrap);
                    var vitrine = document.getElementsByClassName("resultItemsWrapper")[0];
                    newScript.appendChild(inlineScript);
                    vitrine.appendChild(newScript);
                });
            },
            addFilter: input => {
                input.parent().addClass("filter_selected");
                $elements.groupFilters.push(input.attr("rel").split("=")[1] || "");

                handlers.groupFilters(true);
            },
            removeFilter: input => {
                let element = decodeURIComponent(input.attr("rel").split("=")[1] || "");

                input.parent().removeClass("filter_selected");
                $elements.groupFilters = $elements.groupFilters.filter(item => {
                    return decodeURIComponent(item) != element;
                });

                handlers.groupFilters(true);
            },
            groupFilters: itemRemove => {
                let url = new URI(window.location.href);
                let query = url.query() != "" ? parseQuery(url.query()) : {};
                let page = url.fragment() != "" && !itemRemove ? `#${url.fragment()}` : "";
                let urlConcatenated;
                let isEmpty = obj => {
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) return false;
                    }
                    return true;
                };

                if ($elements.groupFilters.length > 0) {
                    query.filters = $elements.groupFilters.length > 0 ? $elements.groupFilters.join("--") : "";
                    urlConcatenated = `${decodeURIComponent(buildQuery(query))}`;
                } else {
                    if (!isEmpty(query)) {
                        delete query.filters;
                        isEmpty(query) ? (query = "") : "";
                        urlConcatenated = `${decodeURIComponent(buildQuery(query))}`;
                    }
                }

                handlers.getFilteredPage();

                window.history.pushState("", "", url.pathname() + `${query != "" ? "?" : ""}${urlConcatenated}${page}`);
            },
            getFilters: () => {
                URI.escapeQuerySpace = false;

                let url = new URI(window.location.href);
                let query = url.query() != "" ? parseQuery(url.query()) : "";

                $elements.groupFilters = query.filters !== undefined ? query.filters.split(/--/g) : [];
                $elements.currentSearchUrl.page = url.fragment() != "" ? `#${url.fragment()}` : "";

                $elements.self.find("input[type='checkbox']").each(function() {
                    let _this = $(this);
                    let $label = _this.parent();
                    let itemRel = decodeURIComponent(_this.attr("rel").split("fq=")[1]);
                    let itemChecked = $.inArray(itemRel, $elements.groupFilters);

                    if (itemChecked >= 0) {
                        _this.prop("checked", true);
                        $label.addClass("filter_selected");
                    }

                    _this.on("change", function() {
                        if (_this.is(":checked")) {
                            handlers.addFilter(_this);
                        } else {
                            handlers.removeFilter(_this);
                        }
                    });
                });

                $elements.groupFilters.length && handlers.getFilteredPage();
            },
            loadPage: () => {
                handlers.getFilters();
            }
        };

        return this.each(init);
    };
})(jQuery, window, document);
