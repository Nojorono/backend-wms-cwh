import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CustomerRepository } from './customer.repository';
import { CreateCustomerMainDto } from './dto/create-customer-main.dto';
import { UpdateCustomerMainDto } from './dto/update-customer-main.dto';
import { CreateCustomerSubdistDto } from './dto/create-customer-subdist.dto';
import { UpdateCustomerSubdistDto } from './dto/update-customer-subdist.dto';
import { CustomerMain } from '../core/domain/entities/customer-main.entity';
import { CustomerSubdist } from '../core/domain/entities/customer-subdist.entity';
import {
  CustomerMainIntegrationService,
  CustomerMainResponseDto,
} from './integration/customer-main-integration.service';
import {
  CustomerSubdistIntegrationService,
  CustomerSubdistResponseDto,
} from './integration/customer-subdist-integration.service';

@Injectable()
export class CustomerService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly customerMainIntegrationService: CustomerMainIntegrationService,
    private readonly customerSubdistIntegrationService: CustomerSubdistIntegrationService,
  ) {}

  // CustomerMain methods
  async createCustomerMain(createDto: CreateCustomerMainDto): Promise<CustomerMain> {
    const orgCode = createDto.orgCode;
    if (!orgCode) {
      throw new BadRequestException('Organization code is required');
    }
    const existingCustomer = await this.repository.findCustomerMainByOrgCode(orgCode);
    if (existingCustomer) {
      throw new ConflictException(`Customer with organization code ${orgCode} already exists`);
    }
    return await this.repository.createCustomerMain(createDto);
  }

  async findAllCustomerMain(): Promise<CustomerMain[]> {
    return await this.repository.findAllCustomerMain();
  }

  async findOneCustomerMain(id: string): Promise<CustomerMain> {
    const customer = await this.repository.findOneCustomerMain(id);
    if (!customer) {
      throw new NotFoundException(`Customer Main with ID ${id} not found`);
    }
    return customer;
  }

  async updateCustomerMain(id: string, updateDto: UpdateCustomerMainDto): Promise<CustomerMain> {
    const customer = await this.findOneCustomerMain(id);
    if (updateDto.orgCode && updateDto.orgCode !== customer.orgCode) {
      const existingCustomer = await this.repository.findCustomerMainByOrgCode(updateDto.orgCode);
      if (existingCustomer) {
        throw new ConflictException(
          `Customer with organization code ${updateDto.orgCode} already exists`,
        );
      }
    }
    const updatedCustomer = await this.repository.updateCustomerMain(id, updateDto);
    if (!updatedCustomer) {
      throw new NotFoundException(`Customer Main with ID ${id} not found`);
    }
    return updatedCustomer;
  }

  async removeCustomerMain(id: string): Promise<void> {
    await this.findOneCustomerMain(id);
    await this.repository.removeCustomerMain(id);
  }

  async createOrUpdateCustomerMainFromMetaOracle(customer: any): Promise<CustomerMain | null> {
    const existingCustomer = await this.repository.findCustomerMainByOrgId(customer.ORG_ID);
    if (existingCustomer) {
      return (
        (await this.repository.updateCustomerMain(existingCustomer.id, {
          businessGroupId: customer.BUSINESS_GROUP_ID,
          dateFrom: customer.DATE_FROM,
          dateTo: customer.DATE_TO,
          defaultLegalContextId: customer.DEFAULT_LEGAL_CONTEXT_ID,
          locationCode: customer.LOCATION_CODE,
          locationDescription: customer.LOCATION_DESCRIPTION,
          name: customer.NAME,
          orgCode: customer.ORG_CODE,
          orgId: customer.ORG_ID,
          setOfBooksId: customer.SET_OF_BOOKS_ID,
          shortCode: customer.SHORT_CODE,
          usableFlag: customer.USABLE_FLAG === 'Y' || customer.USABLE_FLAG === true,
        })) || null
      );
    } else {
      return await this.repository.createCustomerMain({
        businessGroupId: customer.BUSINESS_GROUP_ID,
        dateFrom: customer.DATE_FROM,
        dateTo: customer.DATE_TO,
        defaultLegalContextId: customer.DEFAULT_LEGAL_CONTEXT_ID,
        locationCode: customer.LOCATION_CODE,
        locationDescription: customer.LOCATION_DESCRIPTION,
        name: customer.NAME,
        orgCode: customer.ORG_CODE,
        orgId: customer.ORG_ID,
        setOfBooksId: customer.SET_OF_BOOKS_ID,
        shortCode: customer.SHORT_CODE,
        usableFlag: customer.USABLE_FLAG === 'Y' || customer.USABLE_FLAG === true,
      });
    }
  }

  async syncCustomerMainFromMetaOracle(): Promise<CustomerMainResponseDto> {
    const customerMains = await this.customerMainIntegrationService.getCustomerMains();

    if (customerMains.status) {
      for (const customer of customerMains.data) {
        await this.createOrUpdateCustomerMainFromMetaOracle(customer);
      }
    }

    return customerMains;
  }

  // CustomerSubdist methods
  async createCustomerSubdist(createDto: CreateCustomerSubdistDto): Promise<CustomerSubdist> {
    const customerNumber = createDto.customerNumber;
    if (!customerNumber) {
      throw new BadRequestException('Customer number is required');
    }
    const existingCustomer =
      await this.repository.findCustomerSubdistByCustomerNumber(customerNumber);
    if (existingCustomer) {
      throw new ConflictException(`Customer with number ${customerNumber} already exists`);
    }
    return await this.repository.createCustomerSubdist(createDto);
  }

  async findAllCustomerSubdist(): Promise<CustomerSubdist[]> {
    return await this.repository.findAllCustomerSubdist();
  }

  async findOneCustomerSubdist(id: string): Promise<CustomerSubdist> {
    const customer = await this.repository.findOneCustomerSubdist(id);
    if (!customer) {
      throw new NotFoundException(`Customer Subdist with ID ${id} not found`);
    }
    return customer;
  }

  async updateCustomerSubdist(
    id: string,
    updateDto: UpdateCustomerSubdistDto,
  ): Promise<CustomerSubdist> {
    const customer = await this.findOneCustomerSubdist(id);
    if (updateDto.customerNumber && updateDto.customerNumber !== customer.customerNumber) {
      const existingCustomer = await this.repository.findCustomerSubdistByCustomerNumber(
        updateDto.customerNumber,
      );
      if (existingCustomer) {
        throw new ConflictException(
          `Customer with number ${updateDto.customerNumber} already exists`,
        );
      }
    }
    const updatedCustomer = await this.repository.updateCustomerSubdist(id, updateDto);
    if (!updatedCustomer) {
      throw new NotFoundException(`Customer Subdist with ID ${id} not found`);
    }
    return updatedCustomer;
  }

  async removeCustomerSubdist(id: string): Promise<void> {
    await this.findOneCustomerSubdist(id);
    await this.repository.removeCustomerSubdist(id);
  }

  async createOrUpdateCustomerSubdistFromMetaOracle(
    customer: any,
  ): Promise<CustomerSubdist | null> {
    const existingCustomer = await this.repository.findCustomerSubdistByCustAccountId(
      customer.CUST_ACCOUNT_ID,
    );
    if (existingCustomer) {
      return (
        (await this.repository.updateCustomerSubdist(existingCustomer.id, {
          custAccountId: customer.CUST_ACCOUNT_ID,
          customerName: customer.CUSTOMER_NAME,
          customerNumber: customer.CUSTOMER_NUMBER,
          address1: customer.ADDRESS1,
          provinsi: customer.PROVINSI,
          kabKodya: customer.KAB_KODYA,
          kecamatan: customer.KECAMATAN,
          kelurahan: customer.KELURAHAN,
          orgId: customer.ORG_ID,
          channel: customer.CHANNEL,
          status: customer.STATUS,
          siteType: customer.SITE_TYPE,
          billToLocation: customer.BILL_TO_LOCATION,
          billToSiteUseId: customer.BILL_TO_SITE_USE_ID,
          shipToLocation: customer.SHIP_TO_LOCATION,
          shipToSiteUseId: customer.SHIP_TO_SITE_USE_ID,
          creditChecking: customer.CREDIT_CHECKING,
          overallCreditLimit: customer.OVERALL_CREDIT_LIMIT,
          trxCreditLimit: customer.TRX_CREDIT_LIMIT,
          termId: customer.TERM_ID,
          termName: customer.TERM_NAME,
          termDay: customer.TERM_DAY,
          priceListId: customer.PRICE_LIST_ID,
          priceListName: customer.PRICE_LIST_NAME,
          orderTypeId: customer.ORDER_TYPE_ID,
          orderTypeName: customer.ORDER_TYPE_NAME,
          returnOrderTypeId: customer.RETURN_ORDER_TYPE_ID,
          returnOrderTypeName: customer.RETURN_ORDER_TYPE_NAME,
          lastUpdateDate: customer.LAST_UPDATE_DATE,
        })) || null
      );
    } else {
      return await this.repository.createCustomerSubdist({
        custAccountId: customer.CUST_ACCOUNT_ID,
        customerName: customer.CUSTOMER_NAME,
        customerNumber: customer.CUSTOMER_NUMBER,
        address1: customer.ADDRESS1,
        provinsi: customer.PROVINSI,
        kabKodya: customer.KAB_KODYA,
        kecamatan: customer.KECAMATAN,
        kelurahan: customer.KELURAHAN,
        orgId: customer.ORG_ID,
        channel: customer.CHANNEL,
        status: customer.STATUS,
        siteType: customer.SITE_TYPE,
        billToLocation: customer.BILL_TO_LOCATION,
        billToSiteUseId: customer.BILL_TO_SITE_USE_ID,
        shipToLocation: customer.SHIP_TO_LOCATION,
        shipToSiteUseId: customer.SHIP_TO_SITE_USE_ID,
        creditChecking: customer.CREDIT_CHECKING,
        overallCreditLimit: customer.OVERALL_CREDIT_LIMIT,
        trxCreditLimit: customer.TRX_CREDIT_LIMIT,
        termId: customer.TERM_ID,
        termName: customer.TERM_NAME,
        termDay: customer.TERM_DAY,
        priceListId: customer.PRICE_LIST_ID,
        priceListName: customer.PRICE_LIST_NAME,
        orderTypeId: customer.ORDER_TYPE_ID,
        orderTypeName: customer.ORDER_TYPE_NAME,
        returnOrderTypeId: customer.RETURN_ORDER_TYPE_ID,
        returnOrderTypeName: customer.RETURN_ORDER_TYPE_NAME,
        lastUpdateDate: customer.LAST_UPDATE_DATE,
      });
    }
  }

  async syncCustomerSubdistFromMetaOracle(): Promise<CustomerSubdistResponseDto> {
    const customerSubdists = await this.customerSubdistIntegrationService.getCustomerSubdists();

    if (customerSubdists.status) {
      for (const customer of customerSubdists.data) {
        await this.createOrUpdateCustomerSubdistFromMetaOracle(customer);
      }
    }

    return customerSubdists;
  }
}

