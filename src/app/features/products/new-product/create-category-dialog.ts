import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-create-category-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva categoría</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline">
        <mat-label>Nombre</mat-label>
        <input matInput [formControl]="name" maxlength="100" (keydown.enter)="create()" />
        @if (name.hasError('required') && name.touched) {
          <mat-error>El nombre es obligatorio.</mat-error>
        }
        @if (name.hasError('maxlength')) {
          <mat-error>El nombre no puede superar 100 caracteres.</mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" type="button" (click)="create()">
        Crear categoría
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateCategoryDialog {
  readonly dialogRef = inject(MatDialogRef<CreateCategoryDialog, string | undefined>);
  readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(100)],
  });

  create(): void {
    const name = this.name.value.trim();
    if (!name || this.name.invalid) {
      this.name.markAsTouched();
      return;
    }

    this.dialogRef.close(name);
  }
}
