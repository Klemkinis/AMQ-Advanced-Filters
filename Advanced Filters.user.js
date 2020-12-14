// ==UserScript==
// @name         Advanced Filters
// @version      0.1
// @match        https://animemusicquiz.com/*
// ==/UserScript==

var filterType = {
    missing: 3,
    uploaded: 1
}

var host = {
    catbox: "catbox",
    openingsmoe: "openingsmoe"
}

var resolution = {
    mp3: "mp3",
    480: "480",
    720: "720",
    any: "any"
}

// Possible filters
var somethingOnCatboxFilter = { type: filterType.uploaded, host: host.catbox, resolution: resolution.any }

var missingCatbox720Filter = { type: filterType.missing, host: host.catbox, resolution: resolution["720"] }
var missingCatbox480Filter = { type: filterType.missing, host: host.catbox, resolution: resolution["480"] }
var missingMp3Filter = { type: filterType.missing, host: host.catbox, resolution: resolution.mp3 }
var missingOpeningsMoeFilter = { type: filterType.missing, host: host.openingsmoe, resolution: resolution["720"] } // doesnt matter which resolution

var uploadedCatbox720Filter = { type: filterType.uploaded, host: host.catbox, resolution: resolution["720"] }
var uploadedCatbox480Filter = { type: filterType.uploaded, host: host.catbox, resolution: resolution["480"] }
var uploadedMp3Filter = { type: filterType.uploaded, host: host.catbox, resolution: resolution.mp3 }
var uploadedOpeningsMoeFilter = { type: filterType.uploaded, host: host.openingsmoe, resolution: resolution["720"] } // doesnt matter which resolution

// Presets
var missingEverythingPreset = { title: "Missing", filterList: [missingCatbox720Filter, missingCatbox480Filter, missingMp3Filter, missingOpeningsMoeFilter] }
var hasOnlyMp3Preset = { title: "Only MP3", filterList: [missingCatbox720Filter, missingCatbox480Filter, uploadedMp3Filter, missingOpeningsMoeFilter] }
var missingMp3Preset = { title: "Missing MP3", filterList: [somethingOnCatboxFilter, missingMp3Filter] }
var openingsMoePreset = { title: "Openings.moe", filterList: [uploadedOpeningsMoeFilter] }
var missingCatbox720Preset = { title: "Missing catbox 720", filterList: [missingCatbox720Filter, uploadedCatbox480Filter] }

var presetList = [missingEverythingPreset, hasOnlyMp3Preset, missingMp3Preset, openingsMoePreset, missingCatbox720Preset]
var activeCustomFilterList = []

// ---------------------------------------------------------

ExpandQuestionList.prototype.super_resetFilterLayout = ExpandQuestionList.prototype.resetFilterLayout

hideAmqFilters()
insertButtonRow()
addPresetButtons()


function hideAmqFilters() {
    document.getElementById("elMissingFilter").parentElement.className += " hidden"
    document.getElementById("elOpeningsMoeFilter").parentElement.className += " hidden"
}

function addPresetButtons() {
    presetList.forEach(preset => addPresetButtonButton(preset))
}

function addPresetButtonButton(preset) {
    var buttonRow = lastButtonRow()
    if (buttonRow.children.length >= 3) {
        buttonRow = insertButtonRow()
    }

    var presetButton = document.createElement("div")
    presetButton.className = "elQuestionFilterEntry customFilter clickAble off"
    presetButton.innerHTML = preset.title
    presetButton.onclick = function() {
        togglePresetButton(presetButton, preset)
    }

    buttonRow.append(presetButton)
    updateButtonRowClass(buttonRow)
}

function lastButtonRow() {
    var buttonRows = document.getElementsByClassName('elQuestionFilterRow')
    var lastRow = buttonRows[buttonRows.length - 1]
    return lastRow
}

function insertButtonRow() {
    var buttonRow = document.createElement("div")
    buttonRow.className = "elQuestionFilterRow"

    var filterContainer = document.getElementById('elQuestionFilter')
    var searchBox = document.getElementById('elQuestionFilterInput')
    filterContainer.insertBefore(buttonRow, searchBox)
    return buttonRow
}

function updateButtonRowClass(buttonRow) {
    buttonRow.className = "elQuestionFilterRow"
    if (buttonRow.children.length < 3) {
        buttonRow.className += " twoEntryRow"
    }
}

function togglePresetButton(button, preset) {
    var wasOn = button.className.includes("off") == false

    resetCustomFiltersAppearance()
    activeCustomFilterList = wasOn ? [] : preset.filterList
    expandLibrary.questionListHandler.toggleFilter($(button), preset.title)
    button.className = wasOn ? "elQuestionFilterEntry customFilter clickAble off" : "elQuestionFilterEntry customFilter clickAble"
}

function resetCustomFiltersAppearance() {
    var customFilters = document.getElementsByClassName('customFilter')
    Array.from(customFilters).forEach((filter) => {
        filter.className = "elQuestionFilterEntry customFilter clickAble off"
    })
}

function isIncludedInCustomFilter(songEntry, customFilter) {
    return hasResolutionWithStatus(songEntry, customFilter.host, customFilter.resolution, customFilter.type)
}

function hasResolutionWithStatus(songEntry, host, resolution, status) {
    var hasResolutionInOpenHosts = Object.entries(songEntry.versionStatus.open).map(([hostName, versionStatus]) => {
        if (hostName !== host) {
            return false
        }
        if (resolution === "any") {
            return Object.entries(versionStatus).flatMap(([key, value]) => value).includes(status)
        }

        return (versionStatus[resolution] === status)
    }).includes(true)

    var hasResolutionInClosedHosts = Object.entries(songEntry.versionStatus.closed).map(([hostName, versionStatus]) => {
        return (hostName === host && versionStatus.status === status)
    }).includes(true)

    return (hasResolutionInOpenHosts || hasResolutionInClosedHosts)
}

ExpandQuestionSongEntry.prototype.applyFilter = function(filter, closedHostFilter) {
    var isIncludedInSongTypeFilter = (filter.openings && this.type === 1) || (filter.endings && this.type === 2) || (filter.inserts && this.type === 3)
    var isIncludedInCustomFilters = activeCustomFilterList.map(filter => { return isIncludedInCustomFilter(this, filter) }).includes(false) === false

    this.inFilter = isIncludedInSongTypeFilter && isIncludedInCustomFilters
    this.updateDisplay()
}

ExpandQuestionList.prototype.resetFilterLayout = function() {
    this.super_resetFilterLayout()
    resetCustomFiltersAppearance()
}