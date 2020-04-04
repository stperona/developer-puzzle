import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceQueryFacade } from '@coding-challenge/stocks/data-access-price-query';
import moment from 'moment';

@Component({
  selector: 'coding-challenge-stocks',
  templateUrl: './stocks.component.html',
  styleUrls: ['./stocks.component.css']
})
export class StocksComponent implements OnInit {
  stockPickerForm: FormGroup;
  symbol: string;
  maxDate = moment().startOf('day');

  quotes$ = this.priceQuery.priceQueries$;

  constructor(private fb: FormBuilder, private priceQuery: PriceQueryFacade) {
    this.stockPickerForm = fb.group({
      symbol: [null, Validators.required],
      period: fb.group({
        from: [null, Validators.required],
        to: [null, Validators.required]
      })
    });

    this.stockPickerForm.get('period').valueChanges.subscribe((value: { from: string, to: string }) => {
      // If 'to' value is set to before 'from' value set both values to the same date.
      if (this.stockPickerForm.get('period').valid &&
          moment(value.to).isBefore(moment(value.from))) {
        this.stockPickerForm.patchValue({
          period: {
            from: value.to
          }
        });
      }
    });
  }

  ngOnInit() {}

  fetchQuote() {
    if (this.stockPickerForm.valid) {
      const { symbol, period } = this.stockPickerForm.value;
      this.priceQuery.fetchQuote(symbol, period);
    }
  }
}
