<?php

namespace App\Http\Requests;

use App\Enums\EducationsDegree;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCertificateRequest extends FormRequest
{
    /**
     * Sprawdź czy użytkownik może wykonać to żądanie
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->profile !== null;
    }

    /**
     * Reguły walidacji
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'min:3',
            ],
            'degree' => [
                'required',
                Rule::enum(EducationsDegree::class),
            ],
            'speciality' => [
                'required',
                'string',
                'max:255',
                'min:3',
            ],
            'start_year' => [
                'required',
                'integer',
                'min:1950',
                'max:' . (now()->year + 10),
            ],
            'end_year' => [
                'required',
                'integer',
                'min:1950',
                'max:' . (now()->year + 20),
                'gte:start_year',
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * Niestandardowe komunikaty błędów
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nazwa instytucji jest wymagana.',
            'name.min' => 'Nazwa instytucji musi mieć co najmniej 3 znaki.',
            'name.max' => 'Nazwa instytucji nie może przekraczać 255 znaków.',
            'degree.required' => 'Stopień wykształcenia jest wymagany.',
            'degree.enum' => 'Wybrany stopień wykształcenia jest nieprawidłowy.',
            'speciality.required' => 'Specjalizacja jest wymagana.',
            'speciality.min' => 'Specjalizacja musi mieć co najmniej 3 znaki.',
            'speciality.max' => 'Specjalizacja nie może przekraczać 255 znaków.',
            'start_year.required' => 'Rok rozpoczęcia jest wymagany.',
            'start_year.integer' => 'Rok rozpoczęcia musi być liczbą całkowitą.',
            'start_year.min' => 'Rok rozpoczęcia nie może być wcześniejszy niż 1950.',
            'start_year.max' => 'Rok rozpoczęcia nie może być późniejszy niż ' . (now()->year + 10) . '.',
            'end_year.required' => 'Rok zakończenia jest wymagany.',
            'end_year.integer' => 'Rok zakończenia musi być liczbą całkowitą.',
            'end_year.min' => 'Rok zakończenia nie może być wcześniejszy niż 1950.',
            'end_year.max' => 'Rok zakończenia nie może być późniejszy niż ' . (now()->year + 20) . '.',
            'end_year.gte' => 'Rok zakończenia musi być równy lub późniejszy niż rok rozpoczęcia.',
            'description.max' => 'Opis nie może przekraczać 1000 znaków.',
        ];
    }
}
