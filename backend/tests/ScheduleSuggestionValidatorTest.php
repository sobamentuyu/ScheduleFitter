<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

use App\Http\ScheduleSuggestionValidator;

function validSuggestion(): array
{
    return [
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

$needsClarification = validSuggestion();
$needsClarification['event']['start_at'] = null;
$needsClarification['missing_fields'] = ['start_at'];
$validated = ScheduleSuggestionValidator::validate($needsClarification);
assert($validated['status'] === 'needs_clarification');

$dateMissing = validSuggestion();
$dateMissing['event']['start_at'] = null;
$dateMissing['event']['end_at'] = null;
$dateMissing['missing_fields'] = ['date'];
$validated = ScheduleSuggestionValidator::validate($dateMissing);
assert($validated['status'] === 'needs_clarification');

$titleMissing = validSuggestion();
$titleMissing['event']['title'] = '';
$titleMissing['missing_fields'] = ['title'];
$validated = ScheduleSuggestionValidator::validate($titleMissing);
assert($validated['status'] === 'needs_clarification');

$optionalFieldMissing = validSuggestion();
$optionalFieldMissing['event']['description'] = null;
$optionalFieldMissing['missing_fields'] = [];
$validated = ScheduleSuggestionValidator::validate($optionalFieldMissing);
assert($validated['status'] === 'ready');

expectInvalid(fn (array &$data) => $data['event']['title'] = null, 'invalid title type');
expectInvalid(fn (array &$data) => $data['event']['description'] = 1, 'invalid nullable string');
expectInvalid(fn (array &$data) => $data['event']['all_day'] = 0, 'invalid boolean');
expectInvalid(fn (array &$data) => $data['event']['start_at'] = '2026-02-30T10:00:00+09:00', 'invalid date');
expectInvalid(fn (array &$data) => $data['event']['end_at'] = 'tomorrow', 'invalid datetime format');
expectInvalid(fn (array &$data) => $data['event']['end_at'] = '2026-09-06T14:00:00+09:00', 'end before start');
expectInvalid(function (array &$data): void {
    $data['missing_fields'] = ['start_at', 'start_at'];
}, 'duplicate missing fields');
expectInvalid(function (array &$data): void {
    $data['missing_fields'] = [1];
}, 'non-string missing field');
expectInvalid(function (array &$data): void {
    $data['missing_fields'] = ['description'];
}, 'unsupported missing field');
expectInvalid(function (array &$data): void {
    $data['event']['start_at'] = null;
    $data['missing_fields'] = [];
}, 'null datetime without missing marker');
expectInvalid(function (array &$data): void {
    $data['missing_fields'] = ['start_at'];
}, 'missing marker for present datetime');
expectInvalid(function (array &$data): void {
    $data['event']['start_at'] = null;
    $data['event']['end_at'] = null;
    $data['missing_fields'] = ['date', 'start_at', 'end_at'];
}, 'date marker combined with datetime markers');
expectInvalid(function (array &$data): void {
    $data['event']['title'] = '';
    $data['missing_fields'] = [];
}, 'empty title without missing marker');
expectInvalid(fn (array &$data) => $data['event']['extra'] = true, 'unexpected event key');

echo "ScheduleSuggestionValidator tests passed.\n";
