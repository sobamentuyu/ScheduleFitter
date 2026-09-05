<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Http\ScheduleSuggestionValidator;

function validEvent(): array
{
    return [
        'title' => '打ち合わせ',
        'description' => null,
        'location' => '渋谷',
        'category' => null,
        'start_at' => '2026-09-06T15:00:00+09:00',
        'end_at' => '2026-09-06T16:00:00+09:00',
        'all_day' => false,
        'missing_fields' => [],
    ];
}

function validSuggestion(): array
{
    return [
        'events' => [validEvent()],
    ];
}

function expectInvalid(callable $change, string $message): void
{
    $suggestion = validSuggestion();
    $change($suggestion);

    try {
        ScheduleSuggestionValidator::validate($suggestion);
    } catch (UnexpectedValueException) {
        return;
    }

    throw new RuntimeException("Expected validation failure: {$message}");
}

$valid = validSuggestion();
$validated = ScheduleSuggestionValidator::validate($valid);
assert($validated['status'] === 'ready');
assert(count($validated['events']) === 1);

$empty = ScheduleSuggestionValidator::validate(['events' => []]);
assert($empty['status'] === 'needs_clarification');
assert($empty['events'] === []);

$needsClarification = validSuggestion();
$needsClarification['events'][0]['start_at'] = null;
$needsClarification['events'][0]['missing_fields'] = ['start_at'];
$validated = ScheduleSuggestionValidator::validate($needsClarification);
assert($validated['status'] === 'needs_clarification');

$optionalFieldMissing = validSuggestion();
$optionalFieldMissing['events'][0]['description'] = null;
$optionalFieldMissing['events'][0]['missing_fields'] = ['description'];
$validated = ScheduleSuggestionValidator::validate($optionalFieldMissing);
assert($validated['status'] === 'ready');

$titleMissing = validSuggestion();
$titleMissing['events'][0]['title'] = '';
$titleMissing['events'][0]['missing_fields'] = ['title'];
$validated = ScheduleSuggestionValidator::validate($titleMissing);
assert($validated['status'] === 'needs_clarification');

$multiple = [
    'events' => [
        validEvent(),
        array_merge(validEvent(), [
            'title' => '歯医者',
            'location' => '新宿',
            'start_at' => '2026-09-07T10:00:00+09:00',
            'end_at' => '2026-09-07T11:00:00+09:00',
        ]),
    ],
];
$validated = ScheduleSuggestionValidator::validate($multiple);
assert($validated['status'] === 'ready');
assert(count($validated['events']) === 2);

$legacy = [
    'event' => [
        'title' => '打ち合わせ',
        'description' => null,
        'location' => '渋谷',
        'category' => null,
        'start_at' => '2026-09-06T15:00:00+09:00',
        'end_at' => '2026-09-06T16:00:00+09:00',
        'all_day' => false,
    ],
    'missing_fields' => [],
];
$validated = ScheduleSuggestionValidator::validate($legacy);
assert($validated['status'] === 'ready');
assert($validated['events'][0]['title'] === '打ち合わせ');
assert($validated['events'][0]['missing_fields'] === []);

$withStatus = validSuggestion();
$withStatus['status'] = 'needs_clarification';
$validated = ScheduleSuggestionValidator::validate($withStatus);
assert($validated['status'] === 'ready');

$withoutMissingFields = validSuggestion();
unset($withoutMissingFields['events'][0]['missing_fields']);
$validated = ScheduleSuggestionValidator::validate($withoutMissingFields);
assert($validated['events'][0]['missing_fields'] === []);

expectInvalid(fn (array &$data) => $data['events'][0]['title'] = null, 'invalid title type');
expectInvalid(fn (array &$data) => $data['events'][0]['description'] = 1, 'invalid nullable string');
expectInvalid(fn (array &$data) => $data['events'][0]['all_day'] = 0, 'invalid boolean');
expectInvalid(fn (array &$data) => $data['events'][0]['start_at'] = '2026-02-30T10:00:00+09:00', 'invalid date');
expectInvalid(fn (array &$data) => $data['events'][0]['end_at'] = 'tomorrow', 'invalid datetime format');
expectInvalid(fn (array &$data) => $data['events'][0]['end_at'] = '2026-09-06T14:00:00+09:00', 'end before start');
expectInvalid(function (array &$data): void {
    $data['events'][0]['missing_fields'] = ['start_at', 'start_at'];
}, 'duplicate missing fields');
expectInvalid(function (array &$data): void {
    $data['events'][0]['missing_fields'] = [1];
}, 'non-string missing field');
expectInvalid(fn (array &$data) => $data['events'][0]['extra'] = true, 'unexpected event key');

echo "ScheduleSuggestionValidator tests passed.\n";
