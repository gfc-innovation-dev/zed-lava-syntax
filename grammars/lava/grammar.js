/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * Tree-sitter grammar for the Lava template language (RockRMS).
 *
 * Lava is a Liquid-derivative template language embedded in HTML.
 * This grammar parses Lava constructs and treats everything else
 * (HTML, plain text) as opaque `content` nodes suitable for
 * language injection.
 *
 * Key constructs:
 *   Objects:       {{ expression | filter }}
 *   Tags:          {% tag_name ... %}
 *   Comments:      {% comment %}...{% endcomment %}, //- line, /- block -/
 *   Shortcodes:    {[ name ]}...{[ endname ]}
 *   Shortcode items: [[ item ... ]]...[[ enditem ]]
 *   Embedded blocks: {% javascript %}...{% endjavascript %}, etc.
 */

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Creates a rule for a Lava embedded language block.
 * Pattern: {% open_tag ... %} <content> {% close_tag %}
 */
function embeddedBlock($, openTag, closeTag, ruleName) {
  return seq(
    field('open_tag', alias(
      seq(
        field('tag_begin', alias($._tag_open, 'tag_begin')),
        field('tag_name', alias(openTag, $.tag_name)),
        optional($.tag_parameters),
        field('tag_end', alias($._tag_close, 'tag_end')),
      ),
      $.tag
    )),
    field('content', alias(
      // Content matched by external scanner
      $._block_content,
      $.block_content
    )),
    field('close_tag', alias(
      seq(
        field('tag_begin', alias($._tag_open, 'tag_begin')),
        field('tag_name', alias(closeTag, $.tag_name)),
        field('tag_end', alias($._tag_close, 'tag_end')),
      ),
      $.tag
    )),
  );
}

// ─── Entity command tag names ─────────────────────────────────────
// Rock RMS entity commands that can be used as block tags.
// Sorted by length descending for regex alternation priority.

const ENTITY_COMMANDS = [
  'achievementattempt', 'achievementtype', 'achievementtypeprerequisite',
  'analyticsdimcampus', 'analyticsdimfamilycurrent',
  'analyticsdimfamilyheadofhousehold', 'analyticsdimfamilyhistorical',
  'analyticsdimfinancialaccount', 'analyticsdimfinancialbatch',
  'analyticsdimpersoncurrent', 'analyticsdimpersonhistorical',
  'analyticsfactattendance', 'analyticsfactfinancialtransaction',
  'analyticssourceattendance', 'analyticssourcecampus',
  'analyticssourcefamilyhistorical', 'analyticssourcefinancialtransaction',
  'analyticssourcegivingunit', 'analyticssourcepersonhistorical',
  'assessment', 'assessmenttype', 'assetstorageprovider',
  'attendance', 'attendancecheckinsession', 'attendancecode',
  'attendanceoccurrence', 'attribute', 'attributematrix',
  'attributematrixitem', 'attributematrixtemplate', 'attributequalifier',
  'attributevalue', 'attributevaluehistorical',
  'audit', 'auditdetail', 'auth', 'authauditlog', 'authclaim',
  'authclient', 'authscope',
  'backgroundcheck', 'badge',
  'benevolencerequest', 'benevolencerequestdocument', 'benevolenceresult',
  'benevolencetype', 'benevolenceworkflow',
  'binaryfile', 'binaryfiledata', 'binaryfiletype',
  'block', 'blocktype', 'business',
  'calendarevents', 'campus', 'campusschedule', 'campustopic',
  'category', 'communication', 'communicationattachment',
  'communicationrecipient', 'communicationresponse',
  'communicationresponseattachment', 'communicationtemplate',
  'communicationtemplateattachment',
  'connectionactivitytype', 'connectionopportunity',
  'connectionopportunitycampus', 'connectionopportunityconnectorgroup',
  'connectionopportunitygroup', 'connectionopportunitygroupconfig',
  'connectionrequest', 'connectionrequestactivity',
  'connectionrequestworkflow', 'connectionstatus',
  'connectionstatusautomation', 'connectiontype', 'connectionworkflow',
  'contentchannel', 'contentchannelitem', 'contentchannelitemassociation',
  'contentchannelitemslug', 'contentchanneltype',
  'dataview', 'dataviewfilter', 'definedtype', 'definedvalue',
  'device', 'document', 'documenttype',
  'entitycampusfilter', 'entityset', 'entitysetitem', 'entitytype',
  'eventcalendar', 'eventcalendarcontentchannel', 'eventcalendaritem',
  'eventitem', 'eventitemaudience', 'eventitemoccurrence',
  'eventitemoccurrencechannelitem', 'eventitemoccurrencegroupmap',
  'eventscheduledinstance', 'exceptionlog',
  'fieldtype', 'financialaccount', 'financialbatch', 'financialgateway',
  'financialpaymentdetail', 'financialpersonbankaccount',
  'financialpersonsavedaccount', 'financialpledge',
  'financialscheduledtransaction', 'financialscheduledtransactiondetail',
  'financialstatementtemplate', 'financialtransaction',
  'financialtransactionalert', 'financialtransactionalerttype',
  'financialtransactiondetail', 'financialtransactionimage',
  'financialtransactionrefund',
  'following', 'followingeventnotification', 'followingeventsubscription',
  'followingeventtype', 'followingsuggested', 'followingsuggestiontype',
  'group', 'groupdemographictype', 'groupdemographicvalue',
  'grouphistorical', 'grouplocation', 'grouplocationhistorical',
  'grouplocationhistoricalschedule', 'groupmember',
  'groupmemberassignment', 'groupmemberhistorical',
  'groupmemberrequirement', 'groupmemberscheduletemplate',
  'groupmemberworkflowtrigger', 'grouprequirement',
  'grouprequirementtype', 'groupscheduleexclusion', 'groupsync',
  'grouptype', 'grouptyperole',
  'history', 'htmlcontent',
  'identityverification', 'identityverificationcode',
  'interaction', 'interactionchannel', 'interactioncomponent',
  'interactioncontentchannelitemwrite', 'interactiondevicetype',
  'interactionsession', 'interactionsessionlocation', 'interactionwrite',
  'lavashortcode', 'layout', 'location', 'locationlayout',
  'mediaaccount', 'mediaelement', 'mediafolder', 'mergetemplate',
  'metafirstnamegenderlookup', 'metalastnamelookup',
  'metanicknamelookup', 'metric', 'metriccategory', 'metricpartition',
  'metricvalue', 'metricvaluepartition', 'metricytddata',
  'ncoahistory', 'note', 'noteattachment', 'notetype', 'notewatch',
  'notification', 'notificationrecipient',
  'page', 'pagecontext', 'pageroute', 'pageshortlink',
  'persisteddataset', 'person', 'personaldevice', 'personalias',
  'personallink', 'personallinksection', 'personallinksectionorder',
  'personduplicate', 'personpreviousname', 'personscheduleexclusion',
  'personsearchkey', 'personsignal', 'persontoken', 'personviewed',
  'phonenumber', 'pluginmigration', 'prayerrequest',
  'registration', 'registrationinstance', 'registrationregistrant',
  'registrationregistrantfee', 'registrationsession',
  'registrationtemplate', 'registrationtemplatediscount',
  'registrationtemplatefee', 'registrationtemplatefeeitem',
  'registrationtemplateform', 'registrationtemplateformfield',
  'registrationtemplateplacement',
  'relatedentity', 'remoteauthenticationsession',
  'report', 'reportfield',
  'reservation', 'reservationlocation', 'reservationministry',
  'reservationresource', 'reservationtype', 'reservationworkflow',
  'reservationworkflowtrigger', 'resource',
  'restaction', 'restcontroller',
  'Rock_Model_Block',
  'schedule', 'schedulecategoryexclusion', 'search',
  'servicejob', 'servicejobhistory', 'servicelog',
  'signaltype', 'signaturedocument', 'signaturedocumenttemplate',
  'site', 'sitedomain', 'smsaction', 'smspipeline',
  'step', 'stepprogram', 'stepprogramcompletion', 'stepstatus',
  'steptype', 'steptypeprerequisite', 'stepworkflow',
  'stepworkflowtrigger',
  'streak', 'streaktype', 'streaktypeexclusion',
  'tag', 'taggeditem',
  'userlogin',
  'webfarmnode', 'webfarmnodelog', 'webfarmnodemetric', 'webrequest',
  'workflow', 'workflowaction', 'workflowactionform',
  'workflowactionformattribute', 'workflowactionformsection',
  'workflowactiontype', 'workflowactivate', 'workflowactivity',
  'workflowactivitytype', 'workflowformbuildertemplate',
  'workflowlog', 'workflowtrigger', 'workflowtype',
];

// All Lava filter names from the VS Code grammar
const FILTER_NAMES = [
  'ToBase64', 'AppendSegments', 'EscapeOnce', 'Concat', 'Compact', 'Abs',
  'AppendWatches', 'AddToMergeFields', 'NearestCampus', 'Round', 'FromIdHash',
  'UrlDecode', 'UrlEncode', 'AsGuid', 'Encrypt', 'CreateEntitySet',
  'GuidToId', 'RenderStructuredContentAsHtml', 'DateRangeFromSlidingFormat',
  'PersonByPersonAlternateId', 'PersonImpersonationToken',
  'LastAttendedGroupOfType', 'GeofencingGroupMembers',
  'PersonActionIdentifier', 'EntityFromCachedObject',
  'NumberToRomanNumerals', 'AllKeysFromDictionary',
  'PluralizeForQuantity', 'NumberToOrdinalWords',
  'DeleteUserPreference', 'GetPersonAlternateId',
  'RemoveFromDictionary', 'PersonalizationItems',
  'UnescapeDataString', 'PropertyToKeyValue',
  'RockInstanceConfig', 'GetUserPreference',
  'HasSignedDocument', 'PersonByAliasGuid',
  'PersonTokenCreate', 'SetUserPreference',
  'AddResponseHeader', 'EscapeDataString',
  'RegExMatchValues', 'HumanizeDateTime',
  'HumanizeTimeSpan', 'NextDayOfTheWeek',
  'FormatAsCurrency', 'FamilySalutation',
  'GeofencingGroups', 'AddLinkTagToHead',
  'AddMetaTagToHead', 'PersistedDataset',
  'FilterUnfollowed', 'UniqueIdentifier',
  'IsInSecurityRole', 'AppendFollowing',
  'RegExMatchValue', 'NumberToOrdinal',
  'SortByAttribute', 'HeadOfHousehold',
  'PersonByAliasId', 'PersonTokenRead',
  'SetUrlParameter', 'CreateShortLink',
  'RemoveFromArray', 'AddToDictionary',
  'ObfuscateEmail', 'GroupsAttended',
  'ResolveRockUrl', 'FilterFollowed',
  'AddQuickReturn', 'StripNewlines',
  'TruncateWords', 'DatesFromICal',
  'NumberToWords', 'PageParameter',
  'AddScriptLink', 'TriumphImgCdn',
  'IsDateBetween', 'AsDateTimeUtc',
  'FromMarkdown', 'ReplaceFirst',
  'SentenceCase', 'WithFallback',
  'NearestGroup', 'PersonByGuid',
  'SetPageTitle', 'PageRedirect',
  'Base64Encode', 'RegExReplace',
  'RandomNumber', 'IsInDataView',
  'NewlineToBr', 'ReplaceLast',
  'SanitizeSql', 'Singularize',
  'DaysFromNow', 'DaysInMonth',
  'PhoneNumber', 'HasRightsTo',
  'GroupByGuid', 'WriteCookie',
  'RemoveFirst', 'Capitalize',
  'HtmlDecode', 'Possessive',
  'RegExMatch', 'ToCssClass',
  'SundayDate', 'ToMidnight',
  'ToQuantity', 'Desaturate',
  'PersonById', 'ZebraPhoto',
  'AsDateTime', 'AddCssLink',
  'HmacSha256', 'AddToArray',
  'FromBase64', 'IsFollowed',
  'ReadCookie', 'AddSegment',
  'Pluralize', 'StripHtml',
  'TitleCase', 'TrimStart',
  'DaysSince', 'DaysUntil',
  'DividedBy', 'AdjustHue',
  'Grayscale', 'Attribute',
  'PageRoute', 'FromCache',
  'AsBoolean', 'AsInteger',
  'AsDecimal', 'GroupById',
  'TimeOfDay', 'Downcase',
  'ReadTime', 'ToPascal',
  'Truncate', 'DateDiff',
  'Humanize', 'ToString',
  'Saturate', 'Contains',
  'Children', 'Postback',
  'Property', 'AsDouble',
  'AsString', 'HmacSha1',
  'XamlWrap', 'FromJSON',
  'Distinct', 'ImageUrl',
  'Decrypt', 'Default',
  'Linkify', 'Prepend',
  'Replace', 'TrimEnd',
  'DateAdd', 'AtLeast',
  'Ceiling', 'Lighten',
  'FadeOut', 'OrderBy',
  'Shuffle', 'Address',
  'Parents', 'GroupBy',
  'RunLava', 'Reverse',
  'Append', 'Escape',
  'Upcase', 'AtMost',
  'Format', 'Modulo',
  'Darken', 'FadeIn',
  'Select', 'Campus',
  'Spouse', 'Client',
  'Base64', 'Sha256',
  'ToJSON', 'Remove',
  'Groups', 'First',
  'Right', 'Slice',
  'Split', 'Floor',
  'Minus', 'Times',
  'Shade', 'Where',
  'Notes', 'Debug',
  'Index', 'Steps',
  'Group', 'Last',
  'Size', 'Trim',
  'Date', 'Plus',
  'Tint', 'Join',
  'Sort', 'Page',
  'Sha1', 'Uniq',
  'Mix', 'Map',
  'Url', 'Md5', 'Sum',
];

// Built-in variables recognized by the VS Code grammar
const BUILTIN_VARIABLES = [
  'CurrentPerson', 'Context', 'Campuses', 'PageParameter',
  'CurrentPage', 'Person', 'CurrentBrowser', 'forloop',
  'Item', 'item', 'Items',
];

// ─── Grammar Definition ──────────────────────────────────────────

module.exports = grammar({
  name: 'lava',

  externals: $ => [
    $._content,         // Raw text between Lava constructs (HTML, etc.)
    $._block_content,   // Raw text inside embedded blocks (JS, CSS, SQL, C#)
    $._raw_content,     // Raw text inside {% raw %}...{% endraw %}
    $._comment_content, // Text inside {% comment %}...{% endcomment %}
    $.error_sentinel,   // Sentinel for error recovery
  ],

  extras: _ => [
    /\s/,
  ],

  conflicts: $ => [],

  rules: {
    // ─── Root ──────────────────────────────────────────
    source_file: $ => repeat($._node),

    _node: $ => choice(
      $.comment_block,
      $.line_comment,
      $.block_comment_alt,
      $.frontmatter,
      $.raw_block,
      $.javascript_block,
      $.stylesheet_block,
      $.sql_block,
      $.csharp_block,
      $.object,
      $.tag,
      $.shortcode,
      $.shortcode_item,
      $.content,
    ),

    // ─── Content (non-Lava text, typically HTML) ──────
    content: $ => $._content,

    // ─── Comments ─────────────────────────────────────

    // Block comment: {% comment %}...{% endcomment %}
    comment_block: $ => seq(
      $._tag_open,
      alias('comment', $.tag_name),
      $._tag_close,
      optional(alias($._comment_content, $.comment_content)),
      $._tag_open,
      alias('endcomment', $.tag_name),
      $._tag_close,
    ),

    // Line comment: //- ...
    line_comment: _ => token(seq('//-', /[^\n]*/)),

    // Alt block comment: /- ... -/
    block_comment_alt: _ => token(seq('/-', /[\s\S]*?/, '-/')),

    // ─── Frontmatter ──────────────────────────────────
    // {% comment %}---\n...\n---{% endcomment %}
    // Parsed as a special form of comment block with YAML content
    frontmatter: $ => seq(
      $._tag_open,
      alias('comment', $.tag_name),
      $._tag_close,
      '---',
      field('content', alias($._comment_content, $.frontmatter_content)),
      '---',
      $._tag_open,
      alias('endcomment', $.tag_name),
      $._tag_close,
    ),

    // ─── Raw Block ────────────────────────────────────
    // {% raw %}...{% endraw %} — content is not parsed
    raw_block: $ => seq(
      $._tag_open,
      alias('raw', $.tag_name),
      $._tag_close,
      optional(alias($._raw_content, $.raw_content)),
      $._tag_open,
      alias('endraw', $.tag_name),
      $._tag_close,
    ),

    // ─── Embedded Language Blocks ─────────────────────

    javascript_block: $ => seq(
      $._tag_open,
      alias('javascript', $.tag_name),
      optional($.tag_parameters),
      $._tag_close,
      field('content', alias($._block_content, $.block_content)),
      $._tag_open,
      alias('endjavascript', $.tag_name),
      $._tag_close,
    ),

    stylesheet_block: $ => seq(
      $._tag_open,
      alias('stylesheet', $.tag_name),
      optional($.tag_parameters),
      $._tag_close,
      field('content', alias($._block_content, $.block_content)),
      $._tag_open,
      alias('endstylesheet', $.tag_name),
      $._tag_close,
    ),

    sql_block: $ => seq(
      $._tag_open,
      alias('sql', $.tag_name),
      optional($.tag_parameters),
      $._tag_close,
      field('content', alias($._block_content, $.block_content)),
      $._tag_open,
      alias('endsql', $.tag_name),
      $._tag_close,
    ),

    csharp_block: $ => seq(
      $._tag_open,
      alias('execute', $.tag_name),
      optional($.tag_parameters),
      $._tag_close,
      field('content', alias($._block_content, $.block_content)),
      $._tag_open,
      alias('endexecute', $.tag_name),
      $._tag_close,
    ),

    // ─── Objects: {{ expression }} ────────────────────

    object: $ => seq(
      field('open', $.object_begin),
      optional($._expression),
      field('close', $.object_end),
    ),

    object_begin: _ => token(choice('{{', '{{-')),
    object_end: _ => token(choice('}}', '-}}')),

    // ─── Tags: {% tag_name ... %} ─────────────────────

    tag: $ => seq(
      field('open', alias($._tag_open, $.tag_begin)),
      optional(field('name', $.tag_name)),
      optional($.tag_parameters),
      optional($._expression),
      field('close', alias($._tag_close, $.tag_end)),
    ),

    tag_name: _ => /[a-zA-Z_]\w*/,

    _tag_open: _ => token(choice('{%', '{%-')),
    _tag_close: _ => token(choice('%}', '-%}')),

    // Named parameters: key:'value'
    tag_parameters: $ => repeat1($.parameter),

    parameter: $ => seq(
      field('name', $.attribute_name),
      field('value', $._value),
    ),

    attribute_name: _ => /[a-zA-Z_]\w*:/,

    // ─── Shortcodes: {[ name ... ]} ──────────────────

    shortcode: $ => seq(
      field('open', $.shortcode_begin),
      field('name', $.shortcode_name),
      optional($.tag_parameters),
      field('close', $.shortcode_end),
    ),

    shortcode_begin: _ => token('{['),
    shortcode_end: _ => token(']}'),
    shortcode_name: _ => /[a-zA-Z_]\w*/,

    // Shortcode items: [[ item ... ]]
    shortcode_item: $ => seq(
      field('open', $.shortcode_item_begin),
      field('name', $.shortcode_item_name),
      optional($.tag_parameters),
      field('close', $.shortcode_item_end),
    ),

    shortcode_item_begin: _ => token('[['),
    shortcode_item_end: _ => token(']]'),
    shortcode_item_name: _ => /[a-zA-Z_]\w*/,

    // ─── Expressions ──────────────────────────────────

    _expression: $ => repeat1(choice(
      $.filter,
      $._value,
      $.operator,
      $.word_operator,
      $.assignment_operator,
      $.range,
    )),

    // ─── Filters: | FilterName ────────────────────────

    filter: $ => seq(
      field('pipe', $.pipe),
      field('name', $.filter_name),
      optional(seq(':', $._filter_arguments)),
    ),

    pipe: _ => '|',

    filter_name: _ => token(choice(...FILTER_NAMES)),

    _filter_arguments: $ => seq(
      $._value,
      repeat(seq(',', $._value)),
    ),

    // ─── Values ───────────────────────────────────────

    _value: $ => choice(
      $.string,
      $.number,
      $.boolean,
      $.nil,
      $.blank,
      $.empty,
      $.quoted_support,
      $.variable_lookup,
    ),

    // Strings
    string: $ => choice(
      $.string_single,
      $.string_double,
    ),

    string_single: _ => seq("'", /[^']*/, "'"),
    string_double: _ => seq('"', /[^"]*/, '"'),

    // Numbers
    number: _ => /(-|\+)?\s*[0-9]+(\.[0-9]+)?/,

    // Constants
    boolean: _ => choice('true', 'false'),
    nil: _ => 'nil',
    blank: _ => 'blank',
    empty: _ => 'empty',

    // Special Rock quoted objects: 'Now', 'Global', 'Lava'
    quoted_support: _ => choice("'Now'", "'Global'", "'Lava'"),

    // ─── Variables ────────────────────────────────────

    variable_lookup: $ => seq(
      choice(
        $.builtin_variable,
        $.variable,
      ),
      repeat(seq(
        $.property_accessor,
        $.member_access,
      )),
      optional($.index_access),
    ),

    builtin_variable: _ => token(choice(...BUILTIN_VARIABLES)),

    variable: _ => /[a-zA-Z_][\w-]*/,

    member_access: _ => /[\w][\w?-]*/,

    property_accessor: _ => '.',

    index_access: $ => seq(
      alias('[', $.index_access_begin),
      choice($.string, $.number, $.variable),
      alias(']', $.index_access_end),
    ),

    // ─── Operators ────────────────────────────────────

    operator: _ => choice('==', '!=', '>', '<', '>=', '<='),

    word_operator: _ => choice('and', 'or', 'contains', 'in', 'reversed'),

    assignment_operator: _ => '=',

    // ─── Range: (1..5) ───────────────────────────────

    range: $ => seq(
      '(',
      choice($.number, $.variable),
      alias('..', $.range_operator),
      choice($.number, $.variable),
      ')',
    ),
  },
});
